import { format, parseISO, isToday, isTomorrow, isPast, isFuture } from 'date-fns';

export const formatDate = (date: string | Date, formatStr: string = 'PP'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'h:mm a');
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'PPp');
};

export const getRelativeDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  }
  if (isPast(dateObj)) {
    return formatDate(dateObj, 'MMM d');
  }
  if (isFuture(dateObj)) {
    return formatDate(dateObj, 'MMM d');
  }
  return formatDate(dateObj);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'bg-accent-500';
    case 'booked':
    case 'pending':
      return 'bg-primary-500';
    case 'ongoing':
      return 'bg-warning';
    case 'cancelled':
    case 'refunded':
      return 'bg-error';
    default:
      return 'bg-neutral-400';
  }
};

export const getLoyaltyTierColor = (tier: string): string => {
  switch (tier) {
    case 'Platinum':
      return 'bg-neutral-800';
    case 'Gold':
      return 'bg-yellow-500';
    case 'Silver':
      return 'bg-neutral-400';
    default:
      return 'bg-neutral-300';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

