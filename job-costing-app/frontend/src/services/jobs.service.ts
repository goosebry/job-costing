import api, { PaginatedResponse } from './api';

export interface Job {
  id: string;
  jobNumber: string;
  name: string;
  description?: string;
  status: string;
  clientId?: string;
  clientName?: string;
  client?: { id: string; name: string; contactName?: string; email?: string; phone?: string };
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  estimatedBudget: number;
  startedAt?: string;
  completedAt?: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  _count?: {
    costs: number;
    labor: number;
    changeOrders: number;
    invoices: number;
  };
}

export interface CreateJobRequest {
  name: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  templateId?: string;
  estimatedBudget?: number;
  startedAt?: string;
  status?: string;
}

export interface JobFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const jobsService = {
  async getJobs(filters?: JobFilters): Promise<PaginatedResponse<Job>> {
    const response = await api.get<PaginatedResponse<Job>>('/jobs', { params: filters });
    return response.data;
  },

  async getJob(id: string): Promise<Job & { costs: any[]; labor: any[]; changeOrders: any[]; invoices: any[] }> {
    const response = await api.get<Job & { costs: any[]; labor: any[]; changeOrders: any[]; invoices: any[] }>(`/jobs/${id}`);
    return response.data;
  },

  async createJob(data: CreateJobRequest): Promise<Job> {
    const response = await api.post<Job>('/jobs', data);
    return response.data;
  },

  async updateJob(id: string, data: Partial<CreateJobRequest>): Promise<Job> {
    const response = await api.patch<Job>(`/jobs/${id}`, data);
    return response.data;
  },

  async deleteJob(id: string): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },

  async getTemplates(): Promise<any[]> {
    const response = await api.get<any[]>('/jobs/templates');
    return response.data;
  },

  async createTemplate(data: { name: string; description?: string; estimatedBudget?: number }): Promise<any> {
    const response = await api.post('/jobs/templates', data);
    return response.data;
  },

  async updateTemplate(id: string, data: { name?: string; description?: string; estimatedBudget?: number }): Promise<any> {
    const response = await api.put(`/jobs/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/jobs/templates/${id}`);
  },

  async copyJob(id: string, data: { name?: string; clientId?: string; startedAt?: string }): Promise<Job> {
    const response = await api.post<Job>(`/jobs/${id}/copy`, data);
    return response.data;
  },

  async applyTemplate(jobId: string, templateId: string): Promise<Job> {
    const response = await api.post<Job>(`/jobs/${jobId}/apply-template`, { templateId });
    return response.data;
  },

  async completeJob(id: string, data: { sendEmail?: boolean; notes?: string }): Promise<any> {
    const response = await api.post(`/jobs/${id}/complete`, data);
    return response.data;
  },
};