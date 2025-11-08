import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

const CACHE_KEYS = {
  APPOINTMENTS: 'cached_appointments',
  CLIENTS: 'cached_clients',
  SERVICES: 'cached_services',
  STAFF: 'cached_staff',
  INVENTORY: 'cached_inventory',
  LAST_SYNC: 'last_sync_timestamp',
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface CacheOptions {
  forceRefresh?: boolean;
  maxAge?: number;
}

// Check if cache is valid
const isCacheValid = async (key: string, maxAge: number = CACHE_DURATION): Promise<boolean> => {
  try {
    const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
    if (!lastSync) return false;

    const lastSyncTime = parseInt(lastSync, 10);
    const now = Date.now();
    return now - lastSyncTime < maxAge;
  } catch {
    return false;
  }
};

// Get cached data
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    return data as T;
  } catch {
    return null;
  }
};

// Set cached data
export const setCachedData = async <T>(key: string, data: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

// Cached API calls
export const getCachedAppointments = async (
  options?: CacheOptions
): Promise<any[] | null> => {
  if (!options?.forceRefresh) {
    const cached = await getCachedData<any[]>(CACHE_KEYS.APPOINTMENTS);
    const isValid = await isCacheValid(CACHE_KEYS.APPOINTMENTS, options?.maxAge);
    if (cached && isValid) {
      return cached;
    }
  }

  try {
    const response = await apiService.getAppointments();
    const appointments = response.data?.appointments || [];
    await setCachedData(CACHE_KEYS.APPOINTMENTS, appointments);
    return appointments;
  } catch (error) {
    // Return cached data if available, even if expired
    const cached = await getCachedData<any[]>(CACHE_KEYS.APPOINTMENTS);
    return cached;
  }
};

export const getCachedClients = async (options?: CacheOptions): Promise<any[] | null> => {
  if (!options?.forceRefresh) {
    const cached = await getCachedData<any[]>(CACHE_KEYS.CLIENTS);
    const isValid = await isCacheValid(CACHE_KEYS.CLIENTS, options?.maxAge);
    if (cached && isValid) {
      return cached;
    }
  }

  try {
    const response = await apiService.getClients();
    const clients = response.data?.clients || [];
    await setCachedData(CACHE_KEYS.CLIENTS, clients);
    return clients;
  } catch (error) {
    const cached = await getCachedData<any[]>(CACHE_KEYS.CLIENTS);
    return cached;
  }
};

export const getCachedServices = async (options?: CacheOptions): Promise<any[] | null> => {
  if (!options?.forceRefresh) {
    const cached = await getCachedData<any[]>(CACHE_KEYS.SERVICES);
    const isValid = await isCacheValid(CACHE_KEYS.SERVICES, options?.maxAge);
    if (cached && isValid) {
      return cached;
    }
  }

  try {
    const response = await apiService.getServices();
    const services = response.data?.services || [];
    await setCachedData(CACHE_KEYS.SERVICES, services);
    return services;
  } catch (error) {
    const cached = await getCachedData<any[]>(CACHE_KEYS.SERVICES);
    return cached;
  }
};

export const getCachedStaff = async (options?: CacheOptions): Promise<any[] | null> => {
  if (!options?.forceRefresh) {
    const cached = await getCachedData<any[]>(CACHE_KEYS.STAFF);
    const isValid = await isCacheValid(CACHE_KEYS.STAFF, options?.maxAge);
    if (cached && isValid) {
      return cached;
    }
  }

  try {
    const response = await apiService.getStaff();
    const staff = response.data?.staff || [];
    await setCachedData(CACHE_KEYS.STAFF, staff);
    return staff;
  } catch (error) {
    const cached = await getCachedData<any[]>(CACHE_KEYS.STAFF);
    return cached;
  }
};

// Clear all cache
export const clearCache = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(CACHE_KEYS.APPOINTMENTS),
      AsyncStorage.removeItem(CACHE_KEYS.CLIENTS),
      AsyncStorage.removeItem(CACHE_KEYS.SERVICES),
      AsyncStorage.removeItem(CACHE_KEYS.STAFF),
      AsyncStorage.removeItem(CACHE_KEYS.INVENTORY),
      AsyncStorage.removeItem(CACHE_KEYS.LAST_SYNC),
    ]);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Check online/offline status
export const isOnline = async (): Promise<boolean> => {
  try {
    // Simple check - try to fetch a small resource
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return true;
  } catch {
    return false;
  }
};

