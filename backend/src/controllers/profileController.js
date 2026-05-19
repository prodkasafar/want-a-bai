import prisma from '../config/db.js';

// Get current user profile
export async function getMyProfile(req, res, next) {
  try {
    if (!req.user) {
      return res.status(200).json({ user: null });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        clientProfile: true,
        maidProfile: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

// Create/Update Client Profile
export async function upsertClientProfile(req, res, next) {
  try {
    const { fullName, gender, dob, address, maritalStatus, mobileNumber, email } = req.body;

    if (!fullName || !gender || !dob || !address || !maritalStatus || !mobileNumber) {
      return res.status(400).json({ error: 'Missing mandatory client profile fields' });
    }

    const clientProfile = await prisma.clientProfile.upsert({
      where: { userId: req.user.id },
      update: {
        fullName,
        gender,
        dob: new Date(dob),
        address,
        maritalStatus,
        mobileNumber,
        email: email || null
      },
      create: {
        userId: req.user.id,
        fullName,
        gender,
        dob: new Date(dob),
        address,
        maritalStatus,
        mobileNumber,
        email: email || null
      }
    });

    return res.status(200).json({
      message: 'Client profile updated successfully',
      profile: clientProfile
    });
  } catch (error) {
    next(error);
  }
}

// Create/Update Maid Profile
export async function upsertMaidProfile(req, res, next) {
  try {
    const {
      fullName,
      gender,
      dob,
      permanentAddress,
      mobileNumber,
      alternateMobile,
      emergencyContact,
      profilePhotoUrl,
      services // Expected format: [{ serviceId, expectedSalary }, ...]
    } = req.body;

    if (!fullName || !gender || !dob || !permanentAddress || !mobileNumber || !emergencyContact || !profilePhotoUrl) {
      return res.status(400).json({ error: 'Missing mandatory maid profile fields' });
    }

    // Upsert the main MaidProfile record
    const maidProfile = await prisma.maidProfile.upsert({
      where: { userId: req.user.id },
      update: {
        fullName,
        gender,
        dob: new Date(dob),
        permanentAddress,
        mobileNumber,
        alternateMobile: alternateMobile || null,
        emergencyContact,
        profilePhotoUrl
      },
      create: {
        userId: req.user.id,
        fullName,
        gender,
        dob: new Date(dob),
        permanentAddress,
        mobileNumber,
        alternateMobile: alternateMobile || null,
        emergencyContact,
        profilePhotoUrl,
        status: 'AVAILABLE'
      }
    });

    // Sync MaidServices
    if (Array.isArray(services)) {
      // 1. Delete current associations
      await prisma.maidService.deleteMany({
        where: { maidProfileId: maidProfile.id }
      });

      // 2. Add new associations
      if (services.length > 0) {
        await prisma.maidService.createMany({
          data: services.map(s => ({
            maidProfileId: maidProfile.id,
            serviceId: s.serviceId,
            expectedSalary: parseFloat(s.expectedSalary)
          }))
        });
      }
    }

    const updatedProfile = await prisma.maidProfile.findUnique({
      where: { id: maidProfile.id },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Maid profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    next(error);
  }
}
