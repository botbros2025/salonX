import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from './whatsapp.js';

const prisma = new PrismaClient();

interface BookingState {
  phone: string;
  tenantId?: string;
  clientId?: string;
  step: 'service' | 'date' | 'time' | 'staff' | 'confirm';
  serviceId?: string;
  serviceName?: string;
  selectedDate?: string;
  selectedTime?: string;
  staffId?: string;
  branchId?: string;
  availableSlots?: string[];
  availableStaff?: any[];
}

// In-memory state (in production, use Redis or database)
const bookingStates = new Map<string, BookingState>();

// Extract date from message
const extractDate = (message: string): string | null => {
  const lower = message.toLowerCase();
  const today = new Date();
  
  if (lower.includes('today')) {
    return today.toISOString().split('T')[0];
  }
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Try to extract date patterns like "Jan 15", "15th", "15/01"
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})/,
    /(\d{1,2})th/,
    /(\d{1,2})/,
  ];
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      if (day >= 1 && day <= 31) {
        const date = new Date(today);
        date.setDate(day);
        if (date >= today) {
          return date.toISOString().split('T')[0];
        }
      }
    }
  }
  
  return null;
};

// Extract time from message
const extractTime = (message: string): string | null => {
  const lower = message.toLowerCase();
  
  // Patterns like "5 PM", "17:00", "5pm", "17:30"
  const timePatterns = [
    /(\d{1,2})\s*(am|pm)/i,
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(o'clock|oclock)/i,
  ];
  
  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const period = match[3]?.toLowerCase() || match[4]?.toLowerCase();
      
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return null;
};

// Find service by keyword
const findService = async (tenantId: string, keyword: string): Promise<any | null> => {
  const services = await prisma.service.findMany({
    where: {
      tenantId,
      isActive: true,
    },
  });
  
  const lowerKeyword = keyword.toLowerCase();
  
  for (const service of services) {
    if (
      service.name.toLowerCase().includes(lowerKeyword) ||
      service.description?.toLowerCase().includes(lowerKeyword)
    ) {
      return service;
    }
  }
  
  return null;
};

// Get available time slots
const getAvailableSlots = async (
  tenantId: string,
  branchId: string,
  staffId: string,
  date: string
): Promise<string[]> => {
  const selectedDate = new Date(date);
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      branchId,
      staffId,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['booked', 'ongoing'],
      },
    },
  });
  
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
  });
  
  if (!staff) return [];
  
  const shiftStart = staff.shiftStart ? parseInt(staff.shiftStart.split(':')[0]) : 9;
  const shiftEnd = staff.shiftEnd ? parseInt(staff.shiftEnd.split(':')[0]) : 18;
  
  const slots: string[] = [];
  for (let hour = shiftStart; hour < shiftEnd; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      const isBooked = appointments.some((apt) => {
        const aptTime = new Date(apt.scheduledAt);
        return Math.abs(aptTime.getTime() - slotTime.getTime()) < 30 * 60 * 1000;
      });
      
      if (!isBooked && slotTime > new Date()) {
        slots.push(slotTime.toISOString());
      }
    }
  }
  
  return slots;
};

// Process WhatsApp booking message
export const processWhatsAppBooking = async (
  phoneNumber: string,
  message: string,
  tenantId?: string
): Promise<string> => {
  const state = bookingStates.get(phoneNumber) || {
    phone: phoneNumber,
    step: 'service',
    tenantId,
  };
  
  const lowerMessage = message.toLowerCase().trim();
  
  // Reset if user says cancel or start over
  if (lowerMessage.includes('cancel') || lowerMessage.includes('start over')) {
    bookingStates.delete(phoneNumber);
    return 'Booking cancelled. How can I help you today?';
  }
  
  // Step 1: Service Selection
  if (state.step === 'service') {
    const service = await findService(state.tenantId || '', message);
    
    if (service) {
      state.step = 'date';
      state.serviceId = service.id;
      state.serviceName = service.name;
      bookingStates.set(phoneNumber, state);
      
      // Get branches
      const branches = await prisma.branch.findMany({
        where: { tenantId: state.tenantId },
      });
      
      if (branches.length === 1) {
        state.branchId = branches[0].id;
      }
      
      return `Great! I found "${service.name}" (₹${service.price}, ${service.duration} min).\n\nWhen would you like to book? (e.g., "today at 5 PM" or "tomorrow at 10 AM")`;
    } else {
      // List available services
      const services = await prisma.service.findMany({
        where: {
          tenantId: state.tenantId,
          isActive: true,
        },
        take: 10,
      });
      
      if (services.length === 0) {
        return 'Sorry, no services available at the moment.';
      }
      
      const serviceList = services
        .map((s, i) => `${i + 1}. ${s.name} - ₹${s.price}`)
        .join('\n');
      
      return `Please select a service:\n\n${serviceList}\n\nReply with the service name or number.`;
    }
  }
  
  // Step 2: Date & Time Selection
  if (state.step === 'date') {
    const date = extractDate(message);
    const time = extractTime(message);
    
    if (date) {
      state.selectedDate = date;
      
      if (time) {
        // Both date and time provided
        const dateTime = new Date(`${date}T${time}`);
        state.selectedTime = dateTime.toISOString();
        state.step = 'staff';
      } else {
        state.step = 'time';
        bookingStates.set(phoneNumber, state);
        return `Got it! Date: ${new Date(date).toLocaleDateString()}\n\nWhat time would you prefer? (e.g., "5 PM" or "10:30 AM")`;
      }
    } else if (time) {
      // Only time provided, assume today
      const today = new Date().toISOString().split('T')[0];
      state.selectedDate = today;
      const dateTime = new Date(`${today}T${time}`);
      state.selectedTime = dateTime.toISOString();
      state.step = 'staff';
    } else {
      return 'Please provide a date and time. For example: "today at 5 PM" or "tomorrow at 10 AM"';
    }
  }
  
  // Step 3: Time Selection (if date was provided separately)
  if (state.step === 'time') {
    const time = extractTime(message);
    
    if (time && state.selectedDate) {
      const dateTime = new Date(`${state.selectedDate}T${time}`);
      state.selectedTime = dateTime.toISOString();
      state.step = 'staff';
    } else {
      return 'Please provide a time. For example: "5 PM" or "10:30 AM"';
    }
  }
  
  // Step 4: Staff Selection
  if (state.step === 'staff') {
    if (!state.serviceId || !state.selectedTime || !state.branchId) {
      return 'Missing information. Please start over.';
    }
    
    // Get staff who can perform this service
    const service = await prisma.service.findUnique({
      where: { id: state.serviceId },
      include: {
        serviceStaff: {
          include: {
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    
    if (!service) {
      return 'Service not found. Please start over.';
    }
    
    const eligibleStaff = service.serviceStaff.map((ss) => ss.staff).filter((s) => s.isActive);
    
    if (eligibleStaff.length === 0) {
      return 'Sorry, no staff available for this service.';
    }
    
    if (eligibleStaff.length === 1) {
      // Auto-select if only one staff
      state.staffId = eligibleStaff[0].id;
      state.step = 'confirm';
    } else {
      state.availableStaff = eligibleStaff;
      bookingStates.set(phoneNumber, state);
      
      const staffList = eligibleStaff
        .map((s, i) => `${i + 1}. ${s.user.name} (${s.role})`)
        .join('\n');
      
      return `Please select a staff member:\n\n${staffList}\n\nReply with the name or number.`;
    }
  }
  
  // Handle staff selection by name or number
  if (state.step === 'staff' && state.availableStaff) {
    const selectedStaff = state.availableStaff.find(
      (s, i) =>
        s.user.name.toLowerCase().includes(lowerMessage) ||
        message.trim() === (i + 1).toString()
    );
    
    if (selectedStaff) {
      state.staffId = selectedStaff.id;
      state.step = 'confirm';
    } else {
      return 'Please select a valid staff member from the list.';
    }
  }
  
  // Step 5: Confirmation
  if (state.step === 'confirm') {
    if (!state.serviceId || !state.staffId || !state.selectedTime || !state.branchId) {
      return 'Missing information. Please start over.';
    }
    
    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        tenantId: state.tenantId,
        phone: phoneNumber,
      },
    });
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          tenantId: state.tenantId!,
          name: 'WhatsApp Customer',
          phone: phoneNumber,
        },
      });
    }
    
    state.clientId = client.id;
    
    // Check availability one more time
    const conflicting = await prisma.appointment.findFirst({
      where: {
        staffId: state.staffId,
        branchId: state.branchId,
        status: {
          in: ['booked', 'ongoing'],
        },
        scheduledAt: {
          gte: new Date(new Date(state.selectedTime!).getTime() - 30 * 60 * 1000),
          lte: new Date(new Date(state.selectedTime!).getTime() + 30 * 60 * 1000),
        },
      },
    });
    
    if (conflicting) {
      return 'Sorry, that time slot is no longer available. Please choose another time.';
    }
    
    // Create appointment
    try {
      const appointment = await prisma.appointment.create({
        data: {
          tenantId: state.tenantId!,
          branchId: state.branchId,
          clientId: client.id,
          serviceId: state.serviceId,
          staffId: state.staffId,
          scheduledAt: new Date(state.selectedTime!),
          status: 'booked',
        },
        include: {
          service: true,
          staff: {
            include: {
              user: true,
            },
          },
        },
      });
      
      // Update client visit count
      await prisma.client.update({
        where: { id: client.id },
        data: {
          totalVisits: { increment: 1 },
        },
      });
      
      // Clear booking state
      bookingStates.delete(phoneNumber);
      
      const confirmMessage = `✅ Appointment confirmed!\n\nService: ${appointment.service.name}\nStaff: ${appointment.staff.user.name}\nDate & Time: ${new Date(state.selectedTime!).toLocaleString()}\n\nWe'll send you a reminder 1 hour before. See you soon!`;
      
      return confirmMessage;
    } catch (error) {
      console.error('Error creating appointment:', error);
      return 'Sorry, there was an error creating your appointment. Please try again or call us.';
    }
  }
  
  bookingStates.set(phoneNumber, state);
  return 'I didn\'t understand that. Please try again or type "cancel" to start over.';
};

// Clean up old booking states (older than 1 hour)
export const cleanupBookingStates = (): void => {
  // In production, implement cleanup logic
  // For now, states are kept in memory
};

