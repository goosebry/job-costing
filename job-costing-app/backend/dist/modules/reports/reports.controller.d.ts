import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
export declare class ReportsController {
    getExecutiveSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    getJobCostReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    getProfitabilityReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    getLaborUtilization(req: AuthenticatedRequest, res: Response): Promise<void>;
    getCashFlowReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    exportReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    private convertToCSV;
}
export declare const reportsController: ReportsController;
//# sourceMappingURL=reports.controller.d.ts.map