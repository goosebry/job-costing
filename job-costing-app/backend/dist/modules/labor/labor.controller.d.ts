import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
export declare class LaborController {
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    findAllByJob(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const laborController: LaborController;
//# sourceMappingURL=labor.controller.d.ts.map