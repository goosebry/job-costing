import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service.js';

const notificationsService = new NotificationsService();

export class NotificationsController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const unreadOnly = req.query.unread === 'true';

      const result = await notificationsService.getNotifications(
        req.user.userId,
        { page, limit, unreadOnly }
      );

      res.status(200).json({
        status: 'success',
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      await notificationsService.markAsRead(req.params.id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      await notificationsService.markAllAsRead(req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      await notificationsService.deleteNotification(req.params.id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationsController();