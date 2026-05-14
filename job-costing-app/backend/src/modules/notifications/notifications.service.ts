import { Prisma } from '@prisma/client';
import prisma from '../../config/database.js';

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

export class NotificationsService {
  /**
   * Get notifications for user
   */
  async getNotifications(userId: string, options: GetNotificationsOptions): Promise<GetNotificationsResult> {
    const { page, limit, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCountResult] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, jobNumber: true, name: true } },
          changeOrder: { select: { id: true, title: true } },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
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
  async markAsRead(id: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedJobId?: string;
    relatedChangeOrderId?: string;
  }): Promise<any> {
    return prisma.notification.create({
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
  async createBudgetThresholdNotification(
    userId: string,
    jobId: string,
    threshold: number,
    percentUsed: number
  ): Promise<any> {
    const job = await prisma.job.findUnique({
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