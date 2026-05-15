import { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
declare const app: Express;
declare const httpServer: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
export declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { httpServer };
export default app;
//# sourceMappingURL=server.d.ts.map