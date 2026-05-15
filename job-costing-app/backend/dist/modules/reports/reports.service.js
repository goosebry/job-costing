"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.ReportsService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const error_middleware_1 = require("../../../middleware/error.middleware");
class ReportsService {
    async getExecutiveSummary(organizationId, filters) {
        const { startDate, endDate } = filters;
        const jobs = await database_1.default.job.findMany({
            where: {
                organizationId,
                ...(startDate && { createdAt: { gte: new Date(startDate) } }),
                ...(endDate && { createdAt: { lte: new Date(endDate) } }),
            },
            include: {
                costs: true,
                labor: true,
                changeOrders: { where: { status: 'APPROVED' } },
                invoices: { where: { status: 'PAID' } },
            },
        });
        const summary = jobs.map(job => {
            const totalCosts = job.costs.reduce((sum, c) => sum + Number(c.totalCost), 0);
            const totalLabor = job.labor.reduce((sum, l) => sum + Number(l.totalCost), 0);
            const totalChangeOrders = job.changeOrders.reduce((sum, co) => sum + Number(co.amount), 0);
            const revenue = job.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
            const estimatedBudget = Number(job.estimatedBudget);
            const totalActual = totalCosts + totalLabor;
            const variance = estimatedBudget - totalActual - totalChangeOrders;
            const variancePercent = estimatedBudget > 0 ? (variance / estimatedBudget) * 100 : 0;
            return {
                jobId: job.id,
                jobNumber: job.jobNumber,
                jobName: job.name,
                status: job.status,
                estimatedBudget,
                totalCosts,
                totalLabor,
                totalChangeOrders,
                totalActual,
                revenue,
                variance,
                variancePercent,
            };
        });
        const totals = summary.reduce((acc, job) => ({
            estimatedBudget: acc.estimatedBudget + job.estimatedBudget,
            totalCosts: acc.totalCosts + job.totalCosts,
            totalLabor: acc.totalLabor + job.totalLabor,
            totalChangeOrders: acc.totalChangeOrders + job.totalChangeOrders,
            totalActual: acc.totalActual + job.totalActual,
            revenue: acc.revenue + job.revenue,
            variance: acc.variance + job.variance,
        }), { estimatedBudget: 0, totalCosts: 0, totalLabor: 0, totalChangeOrders: 0, totalActual: 0, revenue: 0, variance: 0 });
        return {
            jobs: summary,
            totals,
            generatedAt: new Date().toISOString(),
        };
    }
    async getJobCostSummary(jobId, organizationId) {
        const job = await database_1.default.job.findFirst({
            where: { id: jobId, organizationId },
            select: { id: true },
        });
        if (!job) {
            throw new error_middleware_1.AppError('Job not found', 404);
        }
        const [costs, labor, changeOrders] = await Promise.all([
            database_1.default.jobCost.findMany({
                where: { jobId },
                include: { category: true },
                orderBy: { dateIncurred: 'desc' },
            }),
            database_1.default.jobLabor.findMany({
                where: { jobId },
                orderBy: { date: 'desc' },
            }),
            database_1.default.changeOrder.findMany({
                where: { jobId, status: 'APPROVED' },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const byCategory = costs.reduce((acc, cost) => {
            const existing = acc.get(cost.categoryId) || { name: cost.category.name, total: 0, count: 0 };
            existing.total += Number(cost.totalCost);
            existing.count += 1;
            acc.set(cost.categoryId, existing);
            return acc;
        }, new Map());
        const totalCosts = costs.reduce((sum, c) => sum + Number(c.totalCost), 0);
        const totalLabor = labor.reduce((sum, l) => sum + Number(l.totalCost), 0);
        const totalChangeOrders = changeOrders.reduce((sum, co) => sum + Number(co.amount), 0);
        return {
            byCategory: Array.from(byCategory.values()),
            totalCosts,
            totalLabor,
            totalChangeOrders,
            grandTotal: totalCosts + totalLabor + totalChangeOrders,
            costs,
            labor,
            changeOrders,
        };
    }
    async getProfitabilityReport(organizationId, filters) {
        const jobs = await database_1.default.job.findMany({
            where: {
                organizationId,
                ...(filters.jobId && { id: filters.jobId }),
            },
            include: {
                costs: { where: { isBillable: true } },
                labor: true,
                changeOrders: { where: { status: 'APPROVED' } },
                invoices: true,
            },
        });
        const profitability = jobs.map(job => {
            const revenue = job.invoices
                .filter(inv => inv.status === 'PAID')
                .reduce((sum, inv) => sum + Number(inv.total), 0);
            const costs = job.costs.reduce((sum, c) => sum + Number(c.totalCost), 0);
            const labor = job.labor.reduce((sum, l) => sum + Number(l.totalCost), 0);
            const changeOrders = job.changeOrders.reduce((sum, co) => sum + Number(co.amount), 0);
            const grossProfit = revenue - costs - labor - changeOrders;
            const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
            return {
                jobId: job.id,
                jobNumber: job.jobNumber,
                jobName: job.name,
                revenue,
                costs,
                labor,
                changeOrders,
                grossProfit,
                margin,
            };
        });
        return {
            jobs: profitability,
            summary: {
                totalRevenue: profitability.reduce((sum, j) => sum + j.revenue, 0),
                totalCosts: profitability.reduce((sum, j) => sum + j.costs, 0),
                totalLabor: profitability.reduce((sum, j) => sum + j.labor, 0),
                totalChangeOrders: profitability.reduce((sum, j) => sum + j.changeOrders, 0),
                totalGrossProfit: profitability.reduce((sum, j) => sum + j.grossProfit, 0),
            },
            generatedAt: new Date().toISOString(),
        };
    }
    async getLaborUtilization(organizationId, filters) {
        const { startDate, endDate } = filters;
        const where = {
            job: { organizationId },
            ...(startDate && { date: { gte: new Date(startDate) } }),
            ...(endDate && { date: { lte: new Date(endDate) } }),
        };
        const labor = await database_1.default.jobLabor.findMany({
            where,
            include: {
                job: { select: { id: true, name: true, jobNumber: true } },
            },
            orderBy: { date: 'desc' },
        });
        const byWorker = labor.reduce((acc, entry) => {
            const existing = acc.get(entry.workerName) || {
                workerName: entry.workerName,
                totalHours: 0,
                totalCost: 0,
                entriesCount: 0,
            };
            existing.totalHours += Number(entry.hoursWorked) + Number(entry.hoursTravel);
            existing.totalCost += Number(entry.totalCost);
            existing.entriesCount += 1;
            acc.set(entry.workerName, existing);
            return acc;
        }, new Map());
        const totalHours = Array.from(byWorker.values()).reduce((sum, w) => sum + w.totalHours, 0);
        const totalCost = Array.from(byWorker.values()).reduce((sum, w) => sum + w.totalCost, 0);
        return {
            byWorker: Array.from(byWorker.values()),
            totals: { totalHours, totalCost, workersCount: byWorker.size },
            entries: labor,
            generatedAt: new Date().toISOString(),
        };
    }
    async getCashFlowReport(organizationId, filters) {
        const { startDate, endDate } = filters;
        const jobs = await database_1.default.job.findMany({
            where: { organizationId },
            include: {
                costs: {
                    where: {
                        ...(startDate && { dateIncurred: { gte: new Date(startDate) } }),
                        ...(endDate && { dateIncurred: { lte: new Date(endDate) } }),
                    },
                },
                labor: {
                    where: {
                        ...(startDate && { date: { gte: new Date(startDate) } }),
                        ...(endDate && { date: { lte: new Date(endDate) } }),
                    },
                },
                invoices: {
                    where: {
                        ...(startDate && { issueDate: { gte: new Date(startDate) } }),
                        ...(endDate && { issueDate: { lte: new Date(endDate) } }),
                    },
                },
            },
        });
        const cashFlow = jobs.map(job => {
            const outflows = [
                ...job.costs.map(c => ({ date: c.dateIncurred, amount: Number(c.totalCost), type: 'cost' })),
                ...job.labor.map(l => ({ date: l.date, amount: Number(l.totalCost), type: 'labor' })),
            ].sort((a, b) => a.date.getTime() - b.date.getTime());
            const inflows = job.invoices
                .filter(inv => inv.status === 'PAID')
                .map(inv => ({ date: inv.paidAt || inv.issueDate, amount: Number(inv.total), type: 'payment' }))
                .sort((a, b) => a.date.getTime() - b.date.getTime());
            return {
                jobId: job.id,
                jobNumber: job.jobNumber,
                jobName: job.name,
                outflows,
                inflows,
                netCashFlow: 0,
            };
        });
        return {
            jobs: cashFlow,
            summary: {
                totalOutflows: cashFlow.reduce((sum, j) => sum + j.outflows.reduce((s, o) => s + o.amount, 0), 0),
                totalInflows: cashFlow.reduce((sum, j) => sum + j.inflows.reduce((s, i) => s + i.amount, 0), 0),
                netCashFlow: 0,
            },
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.ReportsService = ReportsService;
exports.reportsService = new ReportsService();
//# sourceMappingURL=reports.service.js.map