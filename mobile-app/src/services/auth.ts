import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { User, AuthResponse, SignupData, LoginData } from '../types';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const TENANT_DATA_KEY = 'tenant_data';

export class AuthService {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await apiService.signup(data);
    await this.storeAuthData(response);
    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiService.login(data.email, data.password);
    await this.storeAuthData(response);
    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY, TENANT_DATA_KEY]);
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return token !== null;
  }

  private async storeAuthData(response: AuthResponse): Promise<void> {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
    await AsyncStorage.setItem(TENANT_DATA_KEY, JSON.stringify(response.tenant));
  }

  async refreshUserData(): Promise<User | null> {
    try {
      const response = await apiService.getCurrentUser();
      if (response.data?.user) {
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
        return response.data.user;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();

