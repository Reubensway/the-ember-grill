'use client';

/**
 * Shows a toast notification inside the mobile phone frame.
 * Falls back to console.log if the mobile layout isn't mounted.
 */
export function showMobileToast(message: string) {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__showMobileToast) {
    ((window as unknown as Record<string, unknown>).__showMobileToast as (msg: string) => void)(message);
  }
}
