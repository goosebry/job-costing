interface GetNotificationsOptions {
    page: number;
    limit: number;
    unreadOnly: boolean;
}
interface GetNotificationsResult {
    notifications: any[];
    unreadCount: number;
    page: number;
    limit: number;
    total: number;
}
export declare class NotificationsService {
    /**
     * Get notifications for user
     */
    getNotifications(userId: string, options: GetNotificationsOptions): Promise<GetNotificationsResult>;
    /**
     * Mark notification as read
     */
    markAsRead(id: string, userId: string): Promise<void>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(userId: string): Promise<void>;
    /**
     * Delete a notification
     */
    deleteNotification(id: string, userId: string): Promise<void>;
    /**
     * Create a notification
     */
    createNotification(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        relatedJobId?: string;
        relatedChangeOrderId?: string;
    }): Promise<any>;
    /**
     * Create budget threshold notification
     */
    createBudgetThresholdNotification(userId: string, jobId: string, threshold: number, percentUsed: number): Promise<any>;
}
export {};
//# sourceMappingURL=notifications.service.d.ts.map