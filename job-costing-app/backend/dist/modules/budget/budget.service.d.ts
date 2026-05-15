interface BudgetVariance {
    categoryId: string;
    categoryName: string;
    estimated: number;
    actual: number;
    variance: number;
    variancePercent: number;
    status: 'under' | 'on_track' | 'over';
}
interface BudgetSummary {
    jobId: string;
    jobName: string;
    estimatedBudget: number;
    totalCosts: number;
    totalLabor: number;
    totalChangeOrders: number;
    committedCosts: number;
    committedLabor: number;
    committedChangeOrders: number;
    totalActual: number;
    totalCommitted: number;
    totalVariance: number;
    variancePercent: number;
    status: 'under' | 'on_track' | 'over';
    byCategory: BudgetVariance[];
}
export declare class BudgetService {
    getBudgetSummary(jobId: string, organizationId: string): Promise<BudgetSummary>;
    getJobCostSummary(jobId: string, organizationId: string): Promise<{
        pastPeriod: {
            startDate: string;
            totalCost: any;
            entriesCount: any;
        };
        futurePeriod: {
            endDate: string;
            totalCost: any;
            entriesCount: any;
        };
    }>;
}
export declare const budgetService: BudgetService;
export {};
//# sourceMappingURL=budget.service.d.ts.map