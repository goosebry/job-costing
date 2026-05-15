import { Server as SocketIOServer } from 'socket.io';
export declare function setupNotifications(io: SocketIOServer): void;
export declare function sendNotification(io: SocketIOServer, userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}): Promise<{
    message: string;
    type: string;
    userId: string;
    data: import("@prisma/client/runtime/library").JsonValue;
    id: string;
    title: string;
    isRead: boolean;
    createdAt: Date;
} | null>;
export declare function sendOrganizationNotification(io: SocketIOServer, organizationId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}): Promise<{
    message: string;
    type: string;
    userId: string;
    data: import("@prisma/client/runtime/library").JsonValue;
    id: string;
    title: string;
    isRead: boolean;
    createdAt: Date;
}[]>;
//# sourceMappingURL=notifications.socket.d.ts.map