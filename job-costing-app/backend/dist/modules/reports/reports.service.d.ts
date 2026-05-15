interface ReportFilters {
    startDate?: string;
    endDate?: string;
    jobId?: string;
    organizationId: string;
}
interface ProfitabilityReport {
    jobId: string;
    jobNumber: string;
    jobName: string;
    revenue: number;
    costs: number;
    labor: number;
    changeOrders: number;
    grossProfit: number;
    margin: number;
}
export declare class ReportsService {
    getExecutiveSummary(organizationId: string, filters: ReportFilters): Promise<{
        jobs: any;
        totals: any;
        generatedAt: string;
    }>;
    getJobCostSummary(jobId: string, organizationId: string): Promise<{
        byCategory: unknown[];
        totalCosts: any;
        totalLabor: any;
        totalChangeOrders: any;
        grandTotal: any;
        costs: any;
        labor: any;
        changeOrders: any;
    }>;
    getProfitabilityReport(organizationId: string, filters: ReportFilters): Promise<{
        jobs: ProfitabilityReport[];
        summary: {
            totalRevenue: number;
            totalCosts: number;
            totalLabor: number;
            totalChangeOrders: number;
            totalGrossProfit: number;
        };
        generatedAt: string;
    }>;
    getLaborUtilization(organizationId: string, filters: ReportFilters): Promise<{
        byWorker: unknown[];
        totals: {
            totalHours: unknown;
            totalCost: unknown;
            workersCount: any;
        };
        entries: any;
        generatedAt: string;
    }>;
    getCashFlowReport(organizationId: string, filters: ReportFilters): Promise<{
        jobs: any;
        summary: {
            totalOutflows: any;
            totalInflows: any;
            netCashFlow: number;
        };
        generatedAt: string;
    }>;
}
export declare const reportsService: ReportsService;
export {};
//# sourceMappingURL=reports.service.d.ts.map