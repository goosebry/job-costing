import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// Extend Socket type for authenticated sockets
interface AuthenticatedSocket extends ReturnType<SocketIOServer['sockets']['get']> {
  userId?: string;
  organizationId?: string;
  role?: string;
  handshake?: {
    auth?: {
      token?: string;
    };
    headers?: {
      cookie?: string;
    };
  };
  join(room: string): this;
  on(event: string, listener: (...args: any[]) => void): this;
}

export function setupNotifications(io: SocketIOServer) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake?.auth?.token;

    if (!token) {
      // Allow connection without auth for demo mode
      console.log('[WebSocket] Client connected without authentication (demo mode)');
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production') as {
        userId: string;
        organizationId: string;
        role: string;
      };

      socket.userId = decoded.userId;
      socket.organizationId = decoded.organizationId;
      socket.role = decoded.role;

      next();
    } catch {
      // Allow connection without auth for demo mode
      console.log('[WebSocket] Client connected without valid token (demo mode)');
      next();
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`[WebSocket] Client connected: ${socket.userId || 'anonymous'}`);

    if (socket.userId && socket.organizationId) {
      socket.join(`org:${socket.organizationId}`);
      socket.join(`user:${socket.userId}`);
    }

    socket.on('mark-notification-read', async (notificationId: string) => {
      if (!socket.userId) return;
      
      // Skip database operation if not connected
      if (!process.env.DATABASE_URL) return;
      
      try {
        const { default: prisma } = await import('../../config/database');
        await prisma.notification.update({
          where: { id: notificationId, userId: socket.userId },
          data: { isRead: true },
        });
      } catch (error) {
        console.error('[WebSocket] Failed to mark notification read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.userId || 'anonymous'}`);
    });
  });
}

export async function sendNotification(
  io: SocketIOServer,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  // Skip database operation if not connected
  if (!process.env.DATABASE_URL) {
    console.log('[WebSocket] Demo mode - skipping notification save');
    return null;
  }

  try {
    const { default: prisma } = await import('../../config/database');
    const created = await prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
      },
    });

    io.to(`user:${userId}`).emit('notification', created);

    return created;
  } catch (error) {
    console.error('[WebSocket] Failed to send notification:', error);
    return null;
  }
}

export async function sendOrganizationNotification(
  io: SocketIOServer,
  organizationId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  // Skip database operation if not connected
  if (!process.env.DATABASE_URL) {
    console.log('[WebSocket] Demo mode - skipping organization notification');
    return [];
  }

  try {
    const { default: prisma } = await import('../../config/database');
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const notifications = await Promise.all(
      users.map(user =>
        prisma.notification.create({
          data: {
            userId: user.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data || {},
          },
        })
      )
    );

    io.to(`org:${organizationId}`).emit('notification', notifications);

    return notifications;
  } catch (error) {
    console.error('[WebSocket] Failed to send organization notification:', error);
    return [];
  }
}