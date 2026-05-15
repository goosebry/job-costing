"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetService = exports.BudgetService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const error_middleware_1 = require("../../../middleware/error.middleware");
const THRESHOLD = {
    under: -5,
    onTrack: 5,
};
function calculateStatus(variancePercent) {
    if (variancePercent < THRESHOLD.under)
        return 'under';
    if (variancePercent > THRESHOLD.onTrack)
        return 'over';
    return 'on_track';
}
class BudgetService {
    async getBudgetSummary(jobId, organizationId) {
        const job = await database_1.default.job.findFirst({
            where: { id: jobId, organizationId },
            include: {
                costs: {
                    include: { category: true },
                },
                labor: true,
                changeOrders: {
                    where: { status: 'APPROVED' },
                },
            },
        });
        if (!job) {
            throw new error_middleware_1.AppError('Job not found', 404);
        }
        const estimatedBudget = Number(job.estimatedBudget);
        const totalCosts = job.costs.reduce((sum, c) => sum + Number(c.totalCost), 0);
        const totalLabor = job.labor.reduce((sum, l) => sum + Number(l.totalCost), 0);
        const totalChangeOrders = job.changeOrders.reduce((sum, co) => sum + Number(co.amount), 0);
        const committedCosts = job.costs
            .filter(c => c.isCommitted)
            .reduce((sum, c) => sum + Number(c.totalCost), 0);
        const committedLabor = job.labor.reduce((sum, l) => sum + Number(l.totalCost), 0);
        const committedChangeOrders = job.changeOrders
            .filter(co => co.isCommitted)
            .reduce((sum, co) => sum + Number(co.amount), 0);
        const totalActual = totalCosts + totalLabor;
        const totalCommitted = committedCosts + committedLabor + committedChangeOrders;
        const totalVariance = estimatedBudget - totalActual - totalChangeOrders;
        const variancePercent = estimatedBudget > 0
            ? (totalVariance / estimatedBudget) * 100
            : 0;
        const categoryMap = new Map();
        for (const cost of job.costs) {
            const existing = categoryMap.get(cost.categoryId) || {
                estimated: 0,
                actual: 0,
                name: cost.category.name,
            };
            existing.actual += Number(cost.totalCost);
            categoryMap.set(cost.categoryId, existing);
        }
        const byCategory = Array.from(categoryMap.entries()).map(([id, cat]) => {
            const variance = cat.estimated - cat.actual;
            const variancePct = cat.estimated > 0 ? (variance / cat.estimated) * 100 : 0;
            return {
                categoryId: id,
                categoryName: cat.name,
                estimated: cat.estimated,
                actual: cat.actual,
                variance,
                variancePercent: variancePct,
                status: calculateStatus(variancePct),
            };
        });
        return {
            jobId: job.id,
            jobName: job.name,
            estimatedBudget,
            totalCosts,
            totalLabor,
            totalChangeOrders,
            committedCosts,
            committedLabor,
            committedChangeOrders,
            totalActual,
            totalCommitted,
            totalVariance,
            variancePercent,
            status: calculateStatus(variancePercent),
            byCategory,
        };
    }
    async getJobCostSummary(jobId, organizationId) {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const job = await database_1.default.job.findFirst({
            where: { id: jobId, organizationId },
            select: { id: true },
        });
        if (!job) {
            throw new error_middleware_1.AppError('Job not found', 404);
        }
        const [pastCosts, futureCosts] = await Promise.all([
            database_1.default.jobCost.aggregate({
                where: {
                    jobId,
                    dateIncurred: { gte: ninetyDaysAgo },
                },
                _sum: { totalCost: true },
                _count: true,
            }),
            database_1.default.jobCost.aggregate({
                where: {
                    jobId,
                    dateIncurred: { lte: thirtyDaysFromNow, gte: new Date() },
                    isCommitted: true,
                },
                _sum: { totalCost: true },
                _count: true,
            }),
        ]);
        return {
            pastPeriod: {
                startDate: ninetyDaysAgo.toISOString(),
                totalCost: pastCosts._sum.totalCost || 0,
                entriesCount: pastCosts._count,
            },
            futurePeriod: {
                endDate: thirtyDaysFromNow.toISOString(),
                totalCost: futureCosts._sum.totalCost || 0,
                entriesCount: futureCosts._count,
            },
        };
    }
}
exports.BudgetService = BudgetService;
exports.budgetService = new BudgetService();
//# sourceMappingURL=budget.service.js.map