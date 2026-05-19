import prisma from '../config/db.js';

// 1. Initialize Booking Thread
export async function initializeThread(req, res, next) {
  try {
    const { maidProfileId } = req.body;

    if (!req.user.clientProfile) {
      return res.status(400).json({ error: 'Only clients with completed profiles can initiate booking threads' });
    }

    const clientProfile = req.user.clientProfile;

    // Check maid profile and availability
    const maid = await prisma.maidProfile.findUnique({
      where: { id: maidProfileId }
    });

    if (!maid) {
      return res.status(404).json({ error: 'Maid profile not found' });
    }

    if (maid.status === 'APPOINTED') {
      return res.status(400).json({ error: 'Maid is currently appointed and unavailable for discussions' });
    }

    // Check if an OPEN thread already exists between this client and maid
    let thread = await prisma.bookingThread.findFirst({
      where: {
        clientId: clientProfile.id,
        maidId: maid.id,
        status: 'OPEN'
      },
      include: {
        maid: true,
        client: true,
        requests: true
      }
    });

    if (thread) {
      return res.status(200).json({
        message: 'Active negotiation thread already exists. Contact details shared.',
        thread
      });
    }

    // Create a new OPEN thread
    thread = await prisma.bookingThread.create({
      data: {
        clientId: clientProfile.id,
        maidId: maid.id,
        status: 'OPEN'
      },
      include: {
        maid: true,
        client: true,
        requests: true
      }
    });

    // Update maid status to IN_TALKS
    await prisma.maidProfile.update({
      where: { id: maid.id },
      data: { status: 'IN_TALKS' }
    });

    // Send notifications
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Discussion Initiated',
        message: `You opened a discussion with ${maid.fullName}. Mobile: ${maid.mobileNumber}.`
      }
    });

    // Get maid user record to notify them
    const maidUser = await prisma.user.findUnique({ where: { id: maid.userId } });
    if (maidUser) {
      await prisma.notification.create({
        data: {
          userId: maidUser.id,
          title: 'New Discussion Request',
          message: `${clientProfile.fullName} initiated a discussion. Mobile: ${clientProfile.mobileNumber}.`
        }
      });
    }

    return res.status(201).json({
      message: 'Booking thread initiated successfully. Contact details shared.',
      thread
    });
  } catch (error) {
    next(error);
  }
}

// 2. Client Raises Employment Request
export async function raiseRequest(req, res, next) {
  try {
    const { threadId, joiningDate, workingHours, finalSalary } = req.body;

    if (!threadId || !joiningDate || !workingHours || !finalSalary) {
      return res.status(400).json({ error: 'Missing request details' });
    }

    const thread = await prisma.bookingThread.findUnique({
      where: { id: threadId },
      include: {
        requests: true,
        maid: true
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'Booking thread not found' });
    }

    if (thread.status === 'CLOSED') {
      return res.status(400).json({ error: 'This booking thread is closed' });
    }

    // Check decline count in this thread
    const declineCount = thread.requests.filter(r => r.status === 'DECLINED').length;
    if (declineCount >= 3) {
      return res.status(400).json({ error: 'Maximum limit of 3 declines reached. Thread closed.' });
    }

    // Check for any active PENDING request in this thread
    const hasPending = thread.requests.some(r => r.status === 'PENDING');
    if (hasPending) {
      return res.status(400).json({ error: 'There is already a pending request awaiting the maid\'s response.' });
    }

    // Create the request
    const request = await prisma.bookingRequest.create({
      data: {
        threadId,
        joiningDate: new Date(joiningDate),
        workingHours: parseInt(workingHours),
        finalSalary: parseFloat(finalSalary),
        status: 'PENDING'
      }
    });

    // Notify Maid
    const maidUser = await prisma.user.findUnique({ where: { id: thread.maid.userId } });
    if (maidUser) {
      await prisma.notification.create({
        data: {
          userId: maidUser.id,
          title: 'Employment Offer Received',
          message: `Salary offer: Rs. ${finalSalary}/mo for ${workingHours} hrs/day. Please respond.`
        }
      });
    }

    return res.status(201).json({
      message: 'Employment request submitted successfully',
      request
    });
  } catch (error) {
    next(error);
  }
}

// 3. Maid Responds (Approve/Decline)
export async function respondToRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // APPROVE or DECLINE

    if (action !== 'APPROVE' && action !== 'DECLINE') {
      return res.status(400).json({ error: 'Invalid action. Must be APPROVE or DECLINE' });
    }

    const request = await prisma.bookingRequest.findUnique({
      where: { id: requestId },
      include: {
        thread: {
          include: {
            client: true,
            maid: true,
            requests: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    const thread = request.thread;
    const clientUser = await prisma.user.findUnique({ where: { id: thread.client.userId } });

    if (action === 'DECLINE') {
      // Update request status to DECLINED
      await prisma.bookingRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED' }
      });

      // Calculate total declines in this thread
      const previousDeclinesCount = thread.requests.filter(r => r.status === 'DECLINED').length;
      const totalDeclines = previousDeclinesCount + 1;

      if (totalDeclines >= 3) {
        // Close thread
        await prisma.bookingThread.update({
          where: { id: thread.id },
          data: { status: 'CLOSED' }
        });

        // Set maid status back to AVAILABLE
        await prisma.maidProfile.update({
          where: { id: thread.maidId },
          data: { status: 'AVAILABLE' }
        });

        // Notify client
        if (clientUser) {
          await prisma.notification.create({
            data: {
              userId: clientUser.id,
              title: 'Negotiation Thread Closed',
              message: `Your thread with ${thread.maid.fullName} has been CLOSED because they declined 3 times.`
            }
          });
        }

        return res.status(200).json({
          message: 'Offer declined. Max limit reached, negotiation thread closed.',
          threadStatus: 'CLOSED',
          declineCount: totalDeclines
        });
      } else {
        // Notify client they can try again
        if (clientUser) {
          await prisma.notification.create({
            data: {
              userId: clientUser.id,
              title: 'Offer Declined',
              message: `${thread.maid.fullName} declined your offer. You have ${3 - totalDeclines} attempts remaining.`
            }
          });
        }

        return res.status(200).json({
          message: 'Offer declined. Client may submit another request.',
          threadStatus: 'OPEN',
          declineCount: totalDeclines
        });
      }
    } else {
      // APPROVE Workflow
      // Update request status to APPROVED
      await prisma.bookingRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      });

      // Close the current thread (successful booking)
      await prisma.bookingThread.update({
        where: { id: thread.id },
        data: { status: 'CLOSED' }
      });

      // Set maid status to APPOINTED
      await prisma.maidProfile.update({
        where: { id: thread.maidId },
        data: { status: 'APPOINTED' }
      });

      // Generate WAB-ID
      const appointmentCount = await prisma.appointment.count();
      const wabId = '#WAB' + String(appointmentCount + 1).padStart(7, '0');

      // Create active Appointment
      const appointment = await prisma.appointment.create({
        data: {
          wabId,
          clientId: thread.clientId,
          maidId: thread.maidId,
          joiningDate: request.joiningDate,
          workingHours: request.workingHours,
          salary: request.finalSalary,
          status: 'ACTIVE'
        }
      });

      // Close all other OPEN threads for this maid and set their statuses back to AVAILABLE
      // (Wait, since maid status is now APPOINTED, any other clients currently in-talks should be notified)
      const otherOpenThreads = await prisma.bookingThread.findMany({
        where: {
          maidId: thread.maidId,
          status: 'OPEN',
          id: { not: thread.id }
        },
        include: {
          client: true
        }
      });

      for (const otherThread of otherOpenThreads) {
        await prisma.bookingThread.update({
          where: { id: otherThread.id },
          data: { status: 'CLOSED' }
        });

        const otherClientUser = await prisma.user.findUnique({ where: { id: otherThread.client.userId } });
        if (otherClientUser) {
          await prisma.notification.create({
            data: {
              userId: otherClientUser.id,
              title: 'Discussion Closed',
              message: `${thread.maid.fullName} is no longer available as they have been appointed elsewhere.`
            }
          });
        }
      }

      // Notify Client and Maid
      if (clientUser) {
        await prisma.notification.create({
          data: {
            userId: clientUser.id,
            title: 'Hired Successfully!',
            message: `Your employment offer to ${thread.maid.fullName} was APPROVED! WAB-ID is ${wabId}. Verify on arrival.`
          }
        });
      }

      const maidUser = await prisma.user.findUnique({ where: { id: thread.maid.userId } });
      if (maidUser) {
        await prisma.notification.create({
          data: {
            userId: maidUser.id,
            title: 'Hired Successfully!',
            message: `Congratulations! You are hired by ${thread.client.fullName}. WAB-ID is ${wabId}.`
          }
        });
      }

      return res.status(200).json({
        message: 'Employment request approved and WAB-ID generated successfully',
        appointment,
        wabId
      });
    }
  } catch (error) {
    next(error);
  }
}

// 4. Request Employment Termination
export async function requestTermination(req, res, next) {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        maid: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment record not found' });
    }

    if (appointment.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Appointment is not active' });
    }

    // Set appointment status to TERMINATION_PENDING
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'TERMINATION_PENDING' }
    });

    // Notify Maid to approve
    const maidUser = await prisma.user.findUnique({ where: { id: appointment.maid.userId } });
    if (maidUser) {
      await prisma.notification.create({
        data: {
          userId: maidUser.id,
          title: 'Termination Requested',
          message: `${appointment.client.fullName} has requested termination of contract ${appointment.wabId}. Please approve.`
        }
      });
    }

    return res.status(200).json({
      message: 'Termination requested successfully. Awaiting maid approval.',
      appointment: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
}

// 5. Approve Employment Termination
export async function approveTermination(req, res, next) {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        maid: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment record not found' });
    }

    if (appointment.status !== 'TERMINATION_PENDING') {
      return res.status(400).json({ error: 'No termination request exists for this appointment' });
    }

    // Update appointment to TERMINATED and set lastWorkingDay
    const updatedAppointment = await prisma.appointment.update({
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

    // Notify Client
    const clientUser = await prisma.user.findUnique({ where: { id: appointment.client.userId } });
    if (clientUser) {
      await prisma.notification.create({
        data: {
          userId: clientUser.id,
          title: 'Termination Confirmed',
          message: `Contract ${appointment.wabId} for ${appointment.maid.fullName} has been terminated. Maid is now available.`
        }
      });
    }

    return res.status(200).json({
      message: 'Termination approved successfully. Contract is now inactive.',
      appointment: updatedAppointment
    });
  } catch (error) {
    next(error);
  }
}

// 6. Get Bookings & Conversations for logged-in Client or Maid
export async function getMyBookings(req, res, next) {
  try {
    const isClient = req.user.role === 'CLIENT';
    let data = {};

    if (isClient) {
      if (!req.user.clientProfile) {
        return res.status(200).json({ threads: [], appointments: [] });
      }
      const clientId = req.user.clientProfile.id;

      const threads = await prisma.bookingThread.findMany({
        where: { clientId },
        include: {
          maid: true,
          requests: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const appointments = await prisma.appointment.findMany({
        where: { clientId },
        include: { maid: true },
        orderBy: { createdAt: 'desc' }
      });

      data = { threads, appointments };
    } else {
      if (!req.user.maidProfile) {
        return res.status(200).json({ threads: [], appointments: [] });
      }
      const maidId = req.user.maidProfile.id;

      const threads = await prisma.bookingThread.findMany({
        where: { maidId },
        include: {
          client: true,
          requests: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const appointments = await prisma.appointment.findMany({
        where: { maidId },
        include: { client: true },
        orderBy: { createdAt: 'desc' }
      });

      data = { threads, appointments };
    }

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
