// User Types
export type UserRole = 'owner' | 'admin' | 'receptionist' | 'staff' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  tenantId: string;
  branchId?: string | null;
  token?: string;
}

export interface Tenant {
  id: string;
  businessName: string;
  logo?: string | null;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled';
  subscriptionPlan?: string | null;
}

// Auth Types
export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
  businessName: string;
  logo?: string;
  branchName?: string;
  staffCount?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  tenant: Tenant;
}

// Branch Types
export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  tenantId: string;
}

// Staff Types
export interface Staff {
  id: string;
  userId: string;
  branchId: string;
  role: string;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  salary?: number | null;
  joiningDate?: string | null;
  isActive: boolean;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  performance?: {
    servicesCompleted: number;
    revenueGenerated: number;
    averageRating: number;
    totalRatings: number;
  };
}

// Client Types
export interface Client {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  loyaltyTier: 'Silver' | 'Gold' | 'Platinum';
  totalVisits: number;
  totalSpend: number;
  preferredStaffId?: string | null;
  notes?: string | null;
}

// Service Types
export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  duration: number; // minutes
  price: number;
  isActive: boolean;
}

// Appointment Types
export type AppointmentStatus = 'booked' | 'ongoing' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: string;
  tenantId: string;
  branchId: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  status: AppointmentStatus;
  scheduledAt: string;
  completedAt?: string | null;
  notes?: string | null;
  client?: Client;
  service?: Service;
  staff?: {
    id: string;
    user: {
      name: string;
    };
  };
  branch?: {
    name: string;
  };
}

// Inventory Types
export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  unit: string;
  quantity: number;
  threshold: number;
  supplier?: string | null;
  costPrice?: number | null;
  sellingPrice?: number | null;
  isActive: boolean;
}

// Invoice Types
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';

export interface Invoice {
  id: string;
  tenantId: string;
  appointmentId: string;
  clientId: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  notes?: string | null;
  client?: Client;
  appointment?: Appointment;
  invoiceItems?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: 'service' | 'product';
  itemName: string;
  quantity: number;
  price: number;
  total: number;
}

// Feedback Types
export interface Feedback {
  id: string;
  tenantId: string;
  clientId: string;
  appointmentId?: string | null;
  staffId?: string | null;
  rating: number; // 1-5
  comment?: string | null;
  isPublic: boolean;
  createdAt: string;
  client?: {
    name: string;
  };
}

// Analytics Types
export interface SalesOverview {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
}

export interface StaffLeaderboardEntry {
  staffId: string;
  staffName: string;
  revenue: number;
  clientsServed: number;
  averageRating: number;
}

export interface ServicePopularity {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Login: undefined;
  Signup: undefined;
  OwnerDashboard: undefined;
  StaffDashboard: undefined;
  CustomerDashboard: undefined;
  Appointments: undefined;
  AppointmentDetails: { appointmentId: string };
  CreateAppointment: undefined;
  Clients: undefined;
  ClientDetails: { clientId: string };
  Services: undefined;
  Staff: undefined;
  Inventory: undefined;
  Analytics: undefined;
  Settings: undefined;
  Profile: undefined;
  Feedback: {
    appointmentId: string;
    staffId?: string;
    serviceName?: string;
    staffName?: string;
  };
  FeedbackList: undefined;
  Invoice: {
    appointmentId: string;
  };
};

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

