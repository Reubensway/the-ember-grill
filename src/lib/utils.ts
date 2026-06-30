import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as GBP currency (e.g., "£12.50")
 */
export function formatPrice(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

/**
 * Generates an order number like "EMB-XXX" with a random 3-digit suffix
 */
export function generateOrderNumber(): string {
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `EMB-${suffix}`;
}

/**
 * Generates a reservation reference like "RES-XXX" with a random 3-digit suffix
 */
export function generateReference(): string {
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `RES-${suffix}`;
}

/**
 * Formats a date for display (e.g., "19 May 2025")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats time for display (e.g., "18:30" → "6:30 PM")
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Returns human-readable elapsed time (e.g., "5 min ago")
 */
export function getElapsedTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return 'just now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
