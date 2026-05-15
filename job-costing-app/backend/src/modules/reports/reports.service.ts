import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  jobId?: string;
  organizationId: string;
}

interface JobSummary {
  jobId: string;
  jobNumber: string;
  jobName: string;
  status: string;
  estimatedBudget: number;
  totalCosts: number;
  totalLabor: number;
  totalChangeOrders: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
}

interface CostReport {
  period: { start: string; end: string };
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    total: number;
    count: number;
  }>;
  total: number;
}

interface LaborReport {
  period: { start: string; end: string };
  byWorker: Array<{
    workerName: string;
    totalHours: number;
    totalCost: number;
    entriesCount: number;
  }>;
  totalHours: number;
  totalCost: number;
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

export class ReportsService {
  async getExecutiveSummary(organizationId: string, filters: ReportFilters) {
    const { startDate, endDate } = filters;

    const jobs = await prisma.job.findMany({
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

    const totals = summary.reduce(
      (acc, job) => ({
        estimatedBudget: acc.estimatedBudget + job.estimatedBudget,
        totalCosts: acc.totalCosts + job.totalCosts,
        totalLabor: acc.totalLabor + job.totalLabor,
        totalChangeOrders: acc.totalChangeOrders + job.totalChangeOrders,
        totalActual: acc.totalActual + job.totalActual,
        revenue: acc.revenue + job.revenue,
        variance: acc.variance + job.variance,
      }),
      { estimatedBudget: 0, totalCosts: 0, totalLabor: 0, totalChangeOrders: 0, totalActual: 0, revenue: 0, variance: 0 }
    );

    return {
      jobs: summary,
      totals,
      generatedAt: new Date().toISOString(),
    };
  }

  async getJobCostSummary(jobId: string, organizationId: string) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, organizationId },
      select: { id: true },
    });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const [costs, labor, changeOrders] = await Promise.all([
      prisma.jobCost.findMany({
        where: { jobId },
        include: { category: true },
        orderBy: { date: 'desc' },
      }),
      prisma.jobLabor.findMany({
        where: { jobId },
        orderBy: { date: 'desc' },
      }),
      prisma.changeOrder.findMany({
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
    }, new Map<string, { name: string; total: number; count: number }>());

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

  async getProfitabilityReport(organizationId: string, filters: ReportFilters) {
    const jobs = await prisma.job.findMany({
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

    const profitability: ProfitabilityReport[] = jobs.map(job => {
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

  async getLaborUtilization(organizationId: string, filters: ReportFilters) {
    const { startDate, endDate } = filters;

    const where: any = {
      job: { organizationId },
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
    };

    const labor = await prisma.jobLabor.findMany({
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
    }, new Map<string, { workerName: string; totalHours: number; totalCost: number; entriesCount: number }>());

    const totalHours = Array.from(byWorker.values()).reduce((sum, w) => sum + w.totalHours, 0);
    const totalCost = Array.from(byWorker.values()).reduce((sum, w) => sum + w.totalCost, 0);

    return {
      byWorker: Array.from(byWorker.values()),
      totals: { totalHours, totalCost, workersCount: byWorker.size },
      entries: labor,
      generatedAt: new Date().toISOString(),
    };
  }

  async getCashFlowReport(organizationId: string, filters: ReportFilters) {
    const { startDate, endDate } = filters;

    const jobs = await prisma.job.findMany({
      where: { organizationId },
      include: {
        costs: {
          where: {
            ...(startDate && { date: { gte: new Date(startDate) } }),
            ...(endDate && { date: { lte: new Date(endDate) } }),
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
        ...job.costs.map(c => ({ date: c.date, amount: Number(c.totalCost), type: 'cost' as const })),
        ...job.labor.map(l => ({ date: l.date, amount: Number(l.totalCost), type: 'labor' as const })),
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      const inflows = job.invoices
        .filter(inv => inv.status === 'PAID')
        .map(inv => ({ date: inv.paidAt || inv.issueDate, amount: Number(inv.total), type: 'payment' as const }))
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
        totalOutflows: cashFlow.reduce((sum, j) =>
          sum + j.outflows.reduce((s, o) => s + o.amount, 0), 0),
        totalInflows: cashFlow.reduce((sum, j) =>
          sum + j.inflows.reduce((s, i) => s + i.amount, 0), 0),
        netCashFlow: 0,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

export const reportsService = new ReportsService();