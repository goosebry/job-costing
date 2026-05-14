import api from './api';

export interface Client {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  jobs?: ClientJob[];
}

export interface ClientJob {
  id: string;
  jobNumber: string;
  name: string;
  status: string;
  estimatedBudget: number;
  createdAt: string;
  completedAt?: string;
}

export interface CreateClientRequest {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export const clientsService = {
  async getAll(search?: string): Promise<Client[]> {
    const res = await api.get<Client[]>('/clients', { params: search ? { search } : {} });
    return res.data;
  },
  async getOne(id: string): Promise<Client> {
    const res = await api.get<Client>(`/clients/${id}`);
    return res.data;
  },
  async create(data: CreateClientRequest): Promise<Client> {
    const res = await api.post<Client>('/clients', data);
    return res.data;
  },
  async update(id: string, data: Partial<CreateClientRequest>): Promise<Client> {
    const res = await api.put<Client>(`/clients/${id}`, data);
    return res.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
