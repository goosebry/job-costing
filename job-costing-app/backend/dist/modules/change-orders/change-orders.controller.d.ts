import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
export declare class ChangeOrdersController {
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    findAllByJob(req: AuthenticatedRequest, res: Response): Promise<void>;
    approve(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const changeOrdersController: ChangeOrdersController;
//# sourceMappingURL=change-orders.controller.d.ts.map