import { Request, Response, NextFunction } from 'express';
export declare class NotificationsController {
    getNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    markAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: NotificationsController;
export default _default;
//# sourceMappingURL=notifications.controller.d.ts.map