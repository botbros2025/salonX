import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, ApiResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          // Navigate to login (handled by app navigation)
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async signup(data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    businessName: string;
    logo?: string;
    branchName?: string;
  }): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/signup', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Appointments
  async getAppointments(params?: {
    status?: string;
    staffId?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.get('/appointments', { params });
    return response.data;
  }

  async createAppointment(data: {
    clientId?: string;
    clientPhone?: string;
    clientName?: string;
    serviceId: string;
    staffId: string;
    branchId: string;
    scheduledAt: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/appointments', data);
    return response.data;
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: string
  ): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/appointments/${appointmentId}/status`, { status });
    return response.data;
  }

  async getAvailableSlots(params: {
    staffId: string;
    branchId: string;
    date: string;
  }): Promise<ApiResponse<{ slots: string[] }>> {
    const response = await this.client.get('/appointments/availability/slots', { params });
    return response.data;
  }

  // Clients
  async getClients(params?: {
    search?: string;
    loyaltyTier?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.get('/clients', { params });
    return response.data;
  }

  async getClient(clientId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/clients/${clientId}`);
    return response.data;
  }

  async createClient(data: {
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    address?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/clients', data);
    return response.data;
  }

  // Services
  async getServices(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/services');
    return response.data;
  }

  // Staff
  async getStaff(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/staff');
    return response.data;
  }

  async getStaffLeaderboard(period?: string): Promise<ApiResponse<any>> {
    const response = await this.client.get('/staff/leaderboard', { params: { period } });
    return response.data;
  }

  // Inventory
  async getInventory(params?: { lowStock?: boolean; search?: string }): Promise<ApiResponse<any>> {
    const response = await this.client.get('/inventory', { params });
    return response.data;
  }

  async getLowStockAlerts(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/inventory/alerts/low-stock');
    return response.data;
  }

  // Invoices
  async getInvoices(params?: {
    clientId?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.get('/invoices', { params });
    return response.data;
  }

  async createInvoice(data: {
    appointmentId: string;
    subtotal: number;
    tax?: number;
    discount?: number;
    paymentMethod?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/invoices', data);
    return response.data;
  }

  // Feedback
  async getFeedback(params?: {
    staffId?: string;
    minRating?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.get('/feedback', { params });
    return response.data;
  }

  async createFeedback(data: {
    clientId: string;
    appointmentId?: string;
    staffId?: string;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/feedback', data);
    return response.data;
  }

  // Analytics
  async getSalesOverview(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const response = await this.client.get('/analytics/sales', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getServicePopularity(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const response = await this.client.get('/analytics/services/popularity', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getCustomerInsights(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const response = await this.client.get('/analytics/customers', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getInventoryInsights(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/analytics/inventory');
    return response.data;
  }

  // Branches
  async getBranches(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/branches');
    return response.data;
  }
}

export const apiService = new ApiService();

