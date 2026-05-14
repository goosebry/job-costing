import api from './api';

export interface JobStatus {
  id: string;
  value: string;   // API key e.g. "DRAFT"
  label: string;   // Display name e.g. "Draft"
  color: string;   // Hex color e.g. "#6b7280"
  order: number;
}

export const jobStatusesService = {
  async getAll(): Promise<JobStatus[]> {
    const res = await api.get<JobStatus[]>('/settings/job-statuses');
    return res.data;
  },
  async create(data: { label: string; color: string }): Promise<JobStatus> {
    const res = await api.post<JobStatus>('/settings/job-statuses', data);
    return res.data;
  },
  async update(id: string, data: Partial<JobStatus>): Promise<JobStatus> {
    const res = await api.put<JobStatus>(`/settings/job-statuses/${id}`, data);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/settings/job-statuses/${id}`);
  },
  async reorder(statuses: JobStatus[]): Promise<JobStatus[]> {
    const res = await api.put<JobStatus[]>('/settings/job-statuses', statuses);
    return res.data;
  },
};
