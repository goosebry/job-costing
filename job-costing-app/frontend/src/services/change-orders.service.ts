import api from './api';

export interface ChangeOrder {
  id: string;
  jobId: string;
  orderNumber: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: { id: string; firstName: string; lastName: string };
  approvedAt?: string;
  isCommitted: boolean;
  createdAt: string;
}

export interface CreateChangeOrderRequest {
  jobId: string;
  description: string;
  amount: number;
  isCommitted?: boolean;
}

export const changeOrdersService = {
  async getChangeOrdersByJob(jobId: string): Promise<ChangeOrder[]> {
    const response = await api.get<ChangeOrder[]>(`/change-orders/job/${jobId}`);
    return response.data;
  },

  async createChangeOrder(data: CreateChangeOrderRequest): Promise<ChangeOrder> {
    const response = await api.post<ChangeOrder>('/change-orders', data);
    return response.data;
  },

  async approveChangeOrder(id: string, status: 'APPROVED' | 'REJECTED'): Promise<ChangeOrder> {
    const response = await api.patch<ChangeOrder>(`/change-orders/${id}/approve`, { status });
    return response.data;
  },
};