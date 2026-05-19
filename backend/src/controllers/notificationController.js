import prisma from '../config/db.js';

// Get user notifications
export async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
}

// Mark notification as read
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({
      message: 'Notification marked as read',
      notification: updated
    });
  } catch (error) {
    next(error);
  }
}
