import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../utils/ApiError';

export const notificationController = {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId } = req.user!;
      const notifications = await NotificationService.getNotifications(userId);
      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId } = req.user!;
      const notification = await NotificationService.markRead(req.params.id as string, userId);
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId } = req.user!;
      await NotificationService.markAllRead(userId);
      res.status(200).json({ success: true, message: 'All marked as read' });
    } catch (error) {
      next(error);
    }
  },

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId } = req.user!;
      await NotificationService.deleteNotification(req.params.id as string, userId);
      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  },

  async clearAllNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId } = req.user!;
      await NotificationService.clearAll(userId);
      res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
      next(error);
    }
  }
};
