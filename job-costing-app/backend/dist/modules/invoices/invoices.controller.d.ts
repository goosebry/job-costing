import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
export declare class InvoicesController {
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    findAll(req: AuthenticatedRequest, res: Response): Promise<void>;
    findOne(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const invoicesController: InvoicesController;
//# sourceMappingURL=invoices.controller.d.ts.map