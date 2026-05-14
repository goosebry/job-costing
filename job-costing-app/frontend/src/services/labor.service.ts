import api from './api';

export interface JobLabor {
  id: string;
  jobId: string;
  workerName: string;
  role: string;
  hoursWorked: number;
  hourlyRate: number;
  hoursTravel: number;
  totalCost: number;
  date: string;
  createdBy: { id: string; firstName: string; lastName: string };
}

export interface CreateLaborRequest {
  jobId: string;
  workerName: string;
  role: string;
  hoursWorked: number;
  hourlyRate: number;
  hoursTravel?: number;
  date: string;
}

export const laborService = {
  async getLaborByJob(jobId: string): Promise<JobLabor[]> {
    const response = await api.get<JobLabor[]>(`/labor/job/${jobId}`);
    return response.data;
  },

  async createLabor(data: CreateLaborRequest): Promise<JobLabor> {
    const response = await api.post<JobLabor>('/labor', data);
    return response.data;
  },

  async updateLabor(id: string, data: Partial<CreateLaborRequest>): Promise<JobLabor> {
    const response = await api.patch<JobLabor>(`/labor/${id}`, data);
    return response.data;
  },

  async deleteLabor(id: string): Promise<void> {
    await api.delete(`/labor/${id}`);
  },
};