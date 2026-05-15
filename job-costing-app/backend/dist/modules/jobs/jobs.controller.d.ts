import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
export declare class JobsController {
    create(req: AuthenticatedRequest, res: Response): Promise<void>;
    findAll(req: AuthenticatedRequest, res: Response): Promise<void>;
    findOne(req: AuthenticatedRequest, res: Response): Promise<void>;
    update(req: AuthenticatedRequest, res: Response): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response): Promise<void>;
    getTemplates(req: AuthenticatedRequest, res: Response): Promise<void>;
    applyTemplate(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const jobsController: JobsController;
//# sourceMappingURL=jobs.controller.d.ts.map