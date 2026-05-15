"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const database_js_1 = __importDefault(require("../../config/database.js"));
class NotificationsService {
    /**
     * Get notifications for user
     */
    async getNotifications(userId, options) {
        const { page, limit, unreadOnly } = options;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (unreadOnly)
            where.isRead = false;
        const [notifications, total, unreadCountResult] = await Promise.all([
            database_js_1.default.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    job: { select: { id: true, jobNumber: true, name: true } },
                    changeOrder: { select: { id: true, title: true } },
                },
            }),
            database_js_1.default.notification.count({ where }),
            database_js_1.default.notification.count({ where: { userId, isRead: false } }),
        ]);
        return {
            notifications,
            unreadCount: unreadCountResult,
            page,
            limit,
            total,
        };
    }
    /**
     * Mark notification as read
     */
    async markAsRead(id, userId) {
        await database_js_1.default.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }
    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        await database_js_1.default.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    /**
     * Delete a notification
     */
    async deleteNotification(id, userId) {
        await database_js_1.default.notification.deleteMany({
            where: { id, userId },
        });
    }
    /**
     * Create a notification
     */
    async createNotification(data) {
        return database_js_1.default.notification.create({
            data,
            include: {
                job: { select: { id: true, jobNumber: true, name: true } },
                changeOrder: { select: { id: true, title: true } },
            },
        });
    }
    /**
     * Create budget threshold notification
     */
    async createBudgetThresholdNotification(userId, jobId, threshold, percentUsed) {
        const job = await database_js_1.default.job.findUnique({
            where: { id: jobId },
            select: { jobNumber: true, name: true },
        });
        return this.createNotification({
            userId,
            type: 'BUDGET_WARNING',
            title: `Budget Warning: ${job?.name || 'Unknown Job'}`,
            message: `Budget usage has reached ${percentUsed.toFixed(1)}% for job ${job?.jobNumber}`,
            relatedJobId: jobId,
        });
    }
}
exports.NotificationsService = NotificationsService;
//# sourceMappingURL=notifications.service.js.map