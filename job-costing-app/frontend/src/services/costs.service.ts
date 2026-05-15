import api from './api';

export interface CostCategory {
  id: string;
  name: string;
  unitType: string;
  isActive: boolean;
}

export interface JobCost {
  id: string;
  jobId: string;
  categoryId: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  vendor?: string;
  invoiceNumber?: string;
  isBillable: boolean;
  date: string;
  category: CostCategory;
  createdBy: { id: string; firstName: string; lastName: string };
}

export interface CreateCostRequest {
  jobId: string;
  categoryId: string;
  description: string;
  quantity: number;
  unitCost: number;
  vendor?: string;
  invoiceNumber?: string;
  isBillable?: boolean;
  date: string;
}

export const costsService = {
  async getCostsByJob(jobId: string, filters?: { categoryId?: string; startDate?: string; endDate?: string }): Promise<JobCost[]> {
    const response = await api.get<JobCost[]>(`/costs/job/${jobId}`, { params: filters });
    return response.data;
  },

  async createCost(data: CreateCostRequest): Promise<JobCost> {
    const response = await api.post<JobCost>('/costs', data);
    return response.data;
  },

  async updateCost(id: string, data: Partial<CreateCostRequest>): Promise<JobCost> {
    const response = await api.patch<JobCost>(`/costs/${id}`, data);
    return response.data;
  },

  async deleteCost(id: string): Promise<void> {
    await api.delete(`/costs/${id}`);
  },

  async getCategories(): Promise<CostCategory[]> {
    const response = await api.get<CostCategory[]>('/costs/categories');
    return response.data;
  },

  async createCategory(data: { name: string; unitType: string }): Promise<CostCategory> {
    const response = await api.post<CostCategory>('/costs/categories', data);
    return response.data;
  },
};