import api from './api';

export interface ExecutiveSummaryJob {
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

export interface ExecutiveSummary {
  jobs: ExecutiveSummaryJob[];
  totals: {
    estimatedBudget: number;
    totalCosts: number;
    totalLabor: number;
    totalChangeOrders: number;
    totalActual: number;
    revenue: number;
    variance: number;
  };
  generatedAt: string;
}

export const reportsService = {
  async getExecutiveSummary(filters?: { startDate?: string; endDate?: string }): Promise<ExecutiveSummary> {
    const response = await api.get<ExecutiveSummary>('/reports/executive-summary', { params: filters });
    return response.data;
  },

  async getJobCostReport(jobId: string): Promise<any> {
    const response = await api.get(`/reports/job-cost/${jobId}`);
    return response.data;
  },

  async getProfitabilityReport(filters?: { startDate?: string; endDate?: string; jobId?: string }): Promise<any> {
    const response = await api.get('/reports/profitability', { params: filters });
    return response.data;
  },

  async getLaborUtilization(filters?: { startDate?: string; endDate?: string }): Promise<any> {
    const response = await api.get('/reports/labor-utilization', { params: filters });
    return response.data;
  },

  async getCashFlowReport(filters?: { startDate?: string; endDate?: string }): Promise<any> {
    const response = await api.get('/reports/cash-flow', { params: filters });
    return response.data;
  },
};