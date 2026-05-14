import api from './api';

export interface Invoice {
  id: string;
  jobId: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  stripePaymentIntentId?: string;
  paidAt?: string;
  job: { id: string; name: string; jobNumber: string; clientName?: string };
}

export interface CreateInvoiceRequest {
  jobId: string;
  dueDate: string;
  taxRate?: number;
}

export interface InvoiceFilters {
  status?: string;
  jobId?: string;
  page?: number;
  limit?: number;
}

export const invoicesService = {
  async getInvoices(filters?: InvoiceFilters): Promise<{ invoices: Invoice[]; pagination: any }> {
    const response = await api.get('/invoices', { params: filters });
    return response.data;
  },

  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    const response = await api.post<Invoice>('/invoices', data);
    return response.data;
  },

  async updateInvoice(id: string, data: { status?: string; dueDate?: string }): Promise<Invoice> {
    const response = await api.patch<Invoice>(`/invoices/${id}`, data);
    return response.data;
  },

  async createCheckoutSession(invoiceId: string, successUrl: string, cancelUrl: string): Promise<{ sessionId: string; url: string }> {
    const response = await api.post('/stripe/create-checkout-session', {
      invoiceId,
      successUrl,
      cancelUrl,
    });
    return response.data;
  },
};