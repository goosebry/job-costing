import api from './api';

export interface BudgetSummary {
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

export interface BudgetVariance {
  categoryId: string;
  categoryName: string;
  estimated: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'on_track' | 'over';
}

export const budgetService = {
  async getBudgetSummary(jobId: string): Promise<BudgetSummary> {
    const response = await api.get<BudgetSummary>(`/budget/${jobId}/summary`);
    return response.data;
  },

  async getCostSummary(jobId: string): Promise<any> {
    const response = await api.get(`/budget/${jobId}/cost-summary`);
    return response.data;
  },
};