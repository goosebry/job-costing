import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, refreshAccessToken, logout } from '../hooks/useAuth';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Jobs API
export const jobsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },
  list: async (params?: any) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/jobs', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/jobs/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },
};

// Costs API
export const costsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/costs', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/costs/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/costs', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/costs/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/costs/${id}`);
    return response.data;
  },
};

// Labor API
export const laborApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/labor', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/labor/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/labor', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/labor/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/labor/${id}`);
    return response.data;
  },
};

// Budget API
export const budgetApi = {
  getAll: async () => {
    const response = await api.get('/budget');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/budget/${id}`);
    return response.data;
  },
  getSummary: async (jobId: string) => {
    const response = await api.get(`/budget/${jobId}/summary`);
    return response.data;
  },
  getCostSummary: async (jobId: string) => {
    const response = await api.get(`/budget/${jobId}/costs`);
    return response.data;
  },
};

// Change Orders API
export const changeOrdersApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/change-orders', { params });
    return response.data;
  },
  getPending: async () => {
    const response = await api.get('/change-orders/pending');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/change-orders/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/change-orders', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/change-orders/${id}`, data);
    return response.data;
  },
  approve: async (id: string) => {
    const response = await api.patch(`/change-orders/${id}/approve`, { status: 'APPROVED' });
    return response.data;
  },
  reject: async (id: string) => {
    const response = await api.patch(`/change-orders/${id}/approve`, { status: 'REJECTED' });
    return response.data;
  },
};

// Invoices API
export const invoicesApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },
  list: async (params?: any) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/invoices', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/invoices/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },
  send: async (id: string) => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  },
  markPaid: async (id: string) => {
    const response = await api.patch(`/invoices/${id}/paid`);
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  getProfitLoss: async (params?: any) => {
    const response = await api.get('/reports/profit-loss', { params });
    return response.data;
  },
  getLaborAnalysis: async (params?: any) => {
    const response = await api.get('/reports/labor-analysis', { params });
    return response.data;
  },
  getCostBreakdown: async (params?: any) => {
    const response = await api.get('/reports/cost-breakdown', { params });
    return response.data;
  },
  export: async (type: string, params?: any) => {
    const response = await api.get(`/reports/export/${type}`, { params, responseType: 'blob' });
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  list: async (params?: any) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  getUnread: async () => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default api;