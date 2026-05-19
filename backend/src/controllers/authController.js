import prisma from '../config/db.js';

export async function syncAuth(req, res, next) {
  try {
    // 1. If user is already registered and attached by verifyAuth
    if (req.user) {
      return res.status(200).json({
        user: req.user,
        isNew: false
      });
    }

    // 2. If user is not registered, read Firebase token payload
    if (!req.firebaseUser) {
      return res.status(400).json({ error: 'Auth token parsed, but sync payload is missing' });
    }

    const { role } = req.body; // CLIENT or MAID
    if (role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot self-register as Administrator' });
    }

    const finalRole = role === 'MAID' ? 'MAID' : 'CLIENT';

    // 3. Create user record
    const user = await prisma.user.create({
      data: {
        email: req.firebaseUser.email || null,
        phone: req.firebaseUser.phone || null,
        firebaseUid: req.firebaseUser.uid,
        role: finalRole
      },
      include: {
        clientProfile: true,
        maidProfile: true
      }
    });

    // Create notification welcoming them
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to Want-A-Bai!',
        message: `Your account has been created successfully as a ${finalRole.toLowerCase()}. Please complete your profile to proceed.`
      }
    });

    return res.status(201).json({
      user,
      isNew: true
    });
  } catch (error) {
    next(error);
  }
}
