// API helper functions for shops, bookings, and services
import { apiClient } from './apiClient';

export interface ShopsResponse {
  data?: any[];
  count?: number;
  page?: number;
  limit?: number;
}

export interface BookingsResponse {
  data?: any[];
}

export interface ServicesResponse {
  data?: any[];
}

export const shopsApi = {
  async getAll(page?: number, limit?: number): Promise<ShopsResponse | any[]> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<ShopsResponse | any[]>(`/shops${query}`);
  },
  async getById(id: string): Promise<any> {
    return apiClient.get<any>(`/shops/${id}`);
  },
};

export const bookingsApi = {
  async getByShopId(shopId: string): Promise<BookingsResponse | any[]> {
    const response = await apiClient.get<any>(`/shops/${shopId}/bookings`);
    // Handle both array and object responses
    if (Array.isArray(response)) {
      return { data: response };
    }
    return response;
  },
  async create(shopId: string, data: any): Promise<any> {
    return apiClient.post<any>(`/shops/${shopId}/bookings`, data);
  },
};

export const servicesApi = {
  async getByShopId(shopId: string): Promise<ServicesResponse | any[]> {
    const response = await apiClient.get<any>(`/services?shopId=${shopId}`);
    // Handle both array and object responses
    if (Array.isArray(response)) {
      return { data: response };
    }
    return response;
  },
};

export const authApi = {
  async login(email: string, password: string): Promise<any> {
    return apiClient.post<any>('/auth/login', {
      email,
      password,
    });
  },
  async syncUser(userId: string, email: string, name?: string): Promise<any> {
    return apiClient.post<any>('/auth/sync-user', {
      user_id: userId,
      email: email,
      name: name,
    });
  },
};
