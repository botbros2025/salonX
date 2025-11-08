import { 
  User, 
  Tenant, 
  Branch, 
  Staff, 
  Client, 
  Service, 
  Appointment, 
  InventoryItem, 
  Invoice, 
  Feedback,
  StaffPerformance,
  ServiceItem,
  ServiceStaff,
  InvoiceItem,
  WorkingHours,
  AuditLog
} from '@prisma/client';

// Extended types with relations
export type UserWithRelations = User & {
  tenant?: Tenant;
  branch?: Branch | null;
  staff?: Staff | null;
};

export type TenantWithRelations = Tenant & {
  branches?: Branch[];
  users?: User[];
  _count?: {
    users: number;
    clients: number;
    services: number;
    appointments: number;
  };
};

export type BranchWithRelations = Branch & {
  tenant?: Tenant;
  staff?: Staff[];
  _count?: {
    staff: number;
    appointments: number;
  };
};

export type StaffWithRelations = Staff & {
  user: User;
  branch: Branch;
  performance?: StaffPerformance | null;
  appointments?: Appointment[];
};

export type ClientWithRelations = Client & {
  tenant?: Tenant;
  appointments?: Appointment[];
  invoices?: Invoice[];
  feedbacks?: Feedback[];
  _count?: {
    appointments: number;
    invoices: number;
  };
};

export type ServiceWithRelations = Service & {
  tenant?: Tenant;
  serviceItems?: (ServiceItem & {
    inventoryItem: InventoryItem;
  })[];
  serviceStaff?: (ServiceStaff & {
    staff: StaffWithRelations;
  })[];
  appointments?: Appointment[];
  _count?: {
    appointments: number;
  };
};

export type AppointmentWithRelations = Appointment & {
  tenant?: Tenant;
  branch: Branch;
  client: Client;
  service: Service;
  staff: Staff & {
    user: {
      name: string;
    };
  };
  invoice?: Invoice | null;
};

export type InventoryItemWithRelations = InventoryItem & {
  tenant?: Tenant;
  serviceItems?: (ServiceItem & {
    service: Service;
  })[];
};

export type InvoiceWithRelations = Invoice & {
  tenant?: Tenant;
  appointment: Appointment;
  client: Client;
  invoiceItems: InvoiceItem[];
};

export type FeedbackWithRelations = Feedback & {
  tenant?: Tenant;
  client: Client;
};

// Request/Response types
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  businessName: string;
  logo?: string;
  branchName?: string;
  staffCount?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
    branchId?: string | null;
  };
  tenant?: {
    id: string;
    businessName: string;
    subscriptionStatus?: string;
  };
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
  branchId: string;
  shiftStart?: string;
  shiftEnd?: string;
  salary?: number;
  joiningDate?: string;
}

export interface CreateClientRequest {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration: number;
  price: number;
  inventoryItems?: Array<{
    inventoryItemId: string;
    quantity: number;
    unit: string;
  }>;
  staffIds?: string[];
}

export interface CreateAppointmentRequest {
  clientId?: string;
  clientPhone?: string;
  clientName?: string;
  serviceId: string;
  staffId: string;
  branchId: string;
  scheduledAt: string;
  notes?: string;
}

export interface CreateInventoryItemRequest {
  name: string;
  unit: string;
  quantity: number;
  threshold: number;
  supplier?: string;
  costPrice?: number;
  sellingPrice?: number;
}

export interface UpdateAppointmentStatusRequest {
  status: 'booked' | 'ongoing' | 'completed' | 'cancelled' | 'no-show';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
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

// JWT Payload
export interface JWTPayload {
  userId: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

// Express Request with user
export interface AuthenticatedRequest extends Express.Request {
  user: UserWithRelations;
  tenantId: string;
}

// Subscription types
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';

export type UserRole = 'owner' | 'admin' | 'receptionist' | 'staff';
export type AppointmentStatus = 'booked' | 'ongoing' | 'completed' | 'cancelled' | 'no-show';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';
export type LoyaltyTier = 'Silver' | 'Gold' | 'Platinum';

// Analytics types
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

export interface InventoryAlert {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  threshold: number;
  unit: string;
  supplier?: string;
}

// WhatsApp message types
export interface WhatsAppMessage {
  to: string;
  body: string;
}

// Error types
export interface ApiError extends Error {
  status?: number;
  code?: string;
}

