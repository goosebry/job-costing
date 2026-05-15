import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
export declare class BudgetController {
    getBudgetSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    getCostSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const budgetController: BudgetController;
//# sourceMappingURL=budget.controller.d.ts.map