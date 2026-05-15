import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
export declare class CostsController {
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    findAllByJob(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response): Promise<void>;
    getCategories(req: AuthenticatedRequest, res: Response): Promise<void>;
    createCategory(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const costsController: CostsController;
//# sourceMappingURL=costs.controller.d.ts.map