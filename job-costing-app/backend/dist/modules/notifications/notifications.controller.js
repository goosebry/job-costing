"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const notifications_service_js_1 = require("./notifications.service.js");
const notificationsService = new notifications_service_js_1.NotificationsService();
class NotificationsController {
    async getNotifications(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ status: 'error', message: 'Authentication required' });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const unreadOnly = req.query.unread === 'true';
            const result = await notificationsService.getNotifications(req.user.userId, { page, limit, unreadOnly });
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
        }
        catch (error) {
            next(error);
        }
    }
    async markAsRead(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    async deleteNotification(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationsController = NotificationsController;
exports.default = new NotificationsController();
//# sourceMappingURL=notifications.controller.js.map