"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNotifications = setupNotifications;
exports.sendNotification = sendNotification;
exports.sendOrganizationNotification = sendOrganizationNotification;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function setupNotifications(io) {
    io.use(async (socket, next) => {
        const token = socket.handshake?.auth?.token;
        if (!token) {
            // Allow connection without auth for demo mode
            console.log('[WebSocket] Client connected without authentication (demo mode)');
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
            socket.userId = decoded.userId;
            socket.organizationId = decoded.organizationId;
            socket.role = decoded.role;
            next();
        }
        catch {
            // Allow connection without auth for demo mode
            console.log('[WebSocket] Client connected without valid token (demo mode)');
            next();
        }
    });
    io.on('connection', async (socket) => {
        console.log(`[WebSocket] Client connected: ${socket.userId || 'anonymous'}`);
        if (socket.userId && socket.organizationId) {
            socket.join(`org:${socket.organizationId}`);
            socket.join(`user:${socket.userId}`);
        }
        socket.on('mark-notification-read', async (notificationId) => {
            if (!socket.userId)
                return;
            // Skip database operation if not connected
            if (!process.env.DATABASE_URL)
                return;
            try {
                const { default: prisma } = await Promise.resolve().then(() => __importStar(require('../../config/database')));
                await prisma.notification.update({
                    where: { id: notificationId, userId: socket.userId },
                    data: { isRead: true },
                });
            }
            catch (error) {
                console.error('[WebSocket] Failed to mark notification read:', error);
            }
        });
        socket.on('disconnect', () => {
            console.log(`[WebSocket] Client disconnected: ${socket.userId || 'anonymous'}`);
        });
    });
}
async function sendNotification(io, userId, notification) {
    // Skip database operation if not connected
    if (!process.env.DATABASE_URL) {
        console.log('[WebSocket] Demo mode - skipping notification save');
        return null;
    }
    try {
        const { default: prisma } = await Promise.resolve().then(() => __importStar(require('../../config/database')));
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
    }
    catch (error) {
        console.error('[WebSocket] Failed to send notification:', error);
        return null;
    }
}
async function sendOrganizationNotification(io, organizationId, notification) {
    // Skip database operation if not connected
    if (!process.env.DATABASE_URL) {
        console.log('[WebSocket] Demo mode - skipping organization notification');
        return [];
    }
    try {
        const { default: prisma } = await Promise.resolve().then(() => __importStar(require('../../config/database')));
        const users = await prisma.user.findMany({
            where: { organizationId },
            select: { id: true },
        });
        const notifications = await Promise.all(users.map(user => prisma.notification.create({
            data: {
                userId: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data || {},
            },
        })));
        io.to(`org:${organizationId}`).emit('notification', notifications);
        return notifications;
    }
    catch (error) {
        console.error('[WebSocket] Failed to send organization notification:', error);
        return [];
    }
}
//# sourceMappingURL=notifications.socket.js.map