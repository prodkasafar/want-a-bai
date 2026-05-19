import prisma from '../config/db.js';

// Get admin dashboard analytics
export async function getAnalytics(req, res, next) {
  try {
    const clientsCount = await prisma.clientProfile.count();
    const maidsCount = await prisma.maidProfile.count();
    const activeAppointmentsCount = await prisma.appointment.count({
      where: { status: { in: ['ACTIVE', 'TERMINATION_PENDING'] } }
    });
    const pendingRequestsCount = await prisma.bookingRequest.count({
      where: { status: 'PENDING' }
    });

    // Calculate Dec-Factor for each maid
    // Dec-Factor = (Number of declined requests per thread) / (Number of threads)
    const maids = await prisma.maidProfile.findMany({
      include: {
        bookingThreads: {
          include: {
            requests: true
          }
        }
      }
    });

    const maidsWithDecFactor = maids.map(maid => {
      const threadsCount = maid.bookingThreads.length;
      let totalDeclined = 0;

      maid.bookingThreads.forEach(thread => {
        totalDeclined += thread.requests.filter(r => r.status === 'DECLINED').length;
      });

      const decFactor = threadsCount > 0 ? (totalDeclined / threadsCount) : 0;

      return {
        id: maid.id,
        fullName: maid.fullName,
        mobileNumber: maid.mobileNumber,
        status: maid.status,
        profilePhotoUrl: maid.profilePhotoUrl,
        threadsCount,
        totalDeclined,
        decFactor: parseFloat(decFactor.toFixed(2)),
        highlightRed: decFactor > 2.5
      };
    });

    // Get recent administrative actions log
    const recentLogs = await prisma.adminLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    });

    return res.status(200).json({
      metrics: {
        clientsCount,
        maidsCount,
        activeAppointments: activeAppointmentsCount,
        pendingRequests: pendingRequestsCount
      },
      maidsAnalytics: maidsWithDecFactor,
      logs: recentLogs
    });
  } catch (error) {
    next(error);
  }
}

// Service Management (List, Create)
export async function getServices(req, res, next) {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' }
    });
    return res.status(200).json({ services });
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    const service = await prisma.service.create({
      data: { name, description }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_SERVICE',
        details: `Created service: ${name}`
      }
    });

    return res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    next(error);
  }
}

// User Profile Directory for Admin
export async function getUsers(req, res, next) {
  try {
    const clients = await prisma.clientProfile.findMany({
      include: { user: true }
    });
    const maids = await prisma.maidProfile.findMany({
      include: {
        user: true,
        services: {
          include: { service: true }
        }
      }
    });

    return res.status(200).json({ clients, maids });
  } catch (error) {
    next(error);
  }
}

// Delete Client or Maid Profile (Offboarding)
export async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true, maidProfile: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const name = targetUser.clientProfile?.fullName || targetUser.maidProfile?.fullName || 'Unknown';

    // Delete user (cascade will delete profiles)
    await prisma.user.delete({
      where: { id: userId }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_USER',
        details: `Deleted user ${name} (${targetUser.role}) with FirebaseUID: ${targetUser.firebaseUid}`
      }
    });

    return res.status(200).json({ message: 'User offboarded successfully' });
  } catch (error) {
    next(error);
  }
}

// Bookings / Appointments History for Admin
export async function getBookings(req, res, next) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        client: true,
        maid: {
          include: {
            services: {
              include: { service: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const threads = await prisma.bookingThread.findMany({
      include: {
        client: true,
        maid: true,
        requests: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.status(200).json({ appointments, threads });
  } catch (error) {
    next(error);
  }
}

// Force Cancel Appointment by Admin
export async function forceCancelAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, maid: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update appointment to TERMINATED
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'TERMINATED',
        lastWorkingDay: new Date()
      }
    });

    // Update maid status back to AVAILABLE
    await prisma.maidProfile.update({
      where: { id: appointment.maidId },
      data: { status: 'AVAILABLE' }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: req.user.id,
        action: 'FORCE_CANCEL_APPOINTMENT',
        details: `Cancelled contract ${appointment.wabId} between Client: ${appointment.client.fullName} and Maid: ${appointment.maid.fullName}`
      }
    });

    return res.status(200).json({ message: 'Appointment cancelled successfully by Administrator' });
  } catch (error) {
    next(error);
  }
}

// Delete Service Catalog Entry
export async function deleteService(req, res, next) {
  try {
    const { serviceId } = req.params;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if service is linked to active appointments (i.e. appointments where the maid offers this service)
    const activeCount = await prisma.appointment.count({
      where: {
        status: 'ACTIVE',
        maid: {
          services: {
            some: {
              serviceId: serviceId
            }
          }
        }
      }
    });

    if (activeCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete service: It is currently offered by maids with active appointments/contracts.' 
      });
    }

    // Delete service (cascade will delete associations in MaidService)
    await prisma.service.delete({
      where: { id: serviceId }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_SERVICE',
        details: `Deleted service: ${service.name}`
      }
    });

    return res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// Promote user to ADMIN by email
export async function promoteToAdmin(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { clientProfile: true, maidProfile: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    if (targetUser.role === 'ADMIN') {
      return res.status(400).json({ error: 'User is already an Administrator' });
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: 'ADMIN' }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        userId: req.user.id,
        action: 'PROMOTE_TO_ADMIN',
        details: `Promoted user ${email} to Administrator role.`
      }
    });

    return res.status(200).json({ 
      message: `User ${email} successfully promoted to Administrator.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    next(error);
  }
}

