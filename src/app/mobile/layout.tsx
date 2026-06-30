'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { CartProvider } from '@/hooks/use-cart';
import { BottomNav } from '@/components/mobile/BottomNav';
import { PushNotification } from '@/components/mobile/PushNotification';
import { CheckCircle2 } from 'lucide-react';
import { Settings, ShoppingBag, UtensilsCrossed, LogOut, ClipboardList } from 'lucide-react';

const AUTH_ROUTES = ['/mobile/welcome', '/mobile/login', '/mobile/signup', '/mobile/verify', '/mobile/forgot-password'];

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Auto-dismiss toast after 2 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Expose functions globally so child pages can trigger them
  const showToast = useCallback((msg: string) => setToastMessage(msg), []);

  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__toggleMobileSideMenu = () => setSideMenuOpen(true);
    (window as unknown as Record<string, unknown>).__showMobileToast = showToast;
  }

  return (
    <CartProvider>
      {/* Desktop: phone-frame wrapper centered on screen */}
      <div className="flex min-h-screen items-center justify-center bg-charcoal/90 md:py-10">
        <div
          className="relative mx-auto flex h-screen w-full flex-col overflow-hidden bg-cream md:h-[812px] md:w-[375px] md:rounded-[3rem] md:border-[6px] md:border-charcoal/80 md:shadow-xl"
        >
          {/* Notch (desktop only) */}
          <div className="hidden md:block absolute top-0 left-1/2 z-[61] -translate-x-1/2">
            <div className="h-5 w-28 rounded-b-2xl bg-black" />
          </div>

          {/* Status bar — below notch */}
          <div className="absolute top-0 md:top-[6px] left-0 right-0 z-[59] flex items-center justify-between px-5 h-5 text-black">
            <span className="text-[11px] font-semibold">
              {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Signal bars */}
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <rect x="1" y="14" width="4" height="8" rx="1"/>
                <rect x="7" y="10" width="4" height="12" rx="1"/>
                <rect x="13" y="6" width="4" height="16" rx="1"/>
                <rect x="19" y="2" width="4" height="20" rx="1"/>
              </svg>
              {/* WiFi */}
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
              {/* Battery */}
              <svg className="h-3.5 w-4" viewBox="0 0 28 14">
                <rect x="0.75" y="0.75" width="22.5" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <rect x="3" y="3" width="16" height="8" rx="1.5" fill="currentColor"/>
                <rect x="24.5" y="4" width="2.5" height="6" rx="1" fill="currentColor"/>
              </svg>
            </div>
          </div>

          {/* Status bar icons close */}

          {/* Push notification overlay */}
          {!isAuthRoute && <PushNotification />}

          {/* In-frame toast notification */}
          {toastMessage && (
            <div className="absolute top-10 left-4 right-4 z-[250] animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg border border-gray-100">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <p className="text-xs font-medium text-gray-800">{toastMessage}</p>
              </div>
            </div>
          )}

          {/* Bottom Sheet Menu — slides up from bottom */}
          {sideMenuOpen && (
            <div className="absolute inset-0 z-[200] flex flex-col justify-end" onClick={() => setSideMenuOpen(false)}>
              {/* Dark backdrop */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Bottom sheet */}
              <div
                className="relative rounded-t-3xl bg-white px-6 pt-4 pb-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle */}
                <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-300" />

                {/* Quick actions grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <Link
                    href="/mobile/checkout"
                    onClick={() => setSideMenuOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-amber/5 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10">
                      <ShoppingBag className="h-5 w-5 text-amber" />
                    </div>
                    <span className="text-[11px] font-medium text-charcoal">Checkout</span>
                  </Link>
                  <Link
                    href="/mobile/dine-in"
                    onClick={() => setSideMenuOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-green-50 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <UtensilsCrossed className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-[11px] font-medium text-charcoal">Dine-In</span>
                  </Link>
                  <Link
                    href="/mobile/orders"
                    onClick={() => setSideMenuOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-blue-50 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-[11px] font-medium text-charcoal">Orders</span>
                  </Link>
                </div>

                {/* Settings row */}
                <button
                  onClick={() => {
                    setSideMenuOpen(false);
                    router.push('/mobile/settings');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-charcoal hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium">Settings</span>
                  <span className="ml-auto text-xs text-gray-400">›</span>
                </button>

                {/* Logout — subtle, at the very bottom */}
                <button
                  onClick={() => {
                    setSideMenuOpen(false);
                    sessionStorage.removeItem('mobile_authenticated');
                    router.push('/mobile/welcome');
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Main content area with bottom padding for nav */}
          <main className={`flex-1 overflow-y-auto ${isAuthRoute ? 'pt-7 md:pt-10' : 'pb-16 pt-7 md:pt-10'}`}>
            {children}
          </main>

          {/* Bottom navigation — hidden on auth routes */}
          {!isAuthRoute && <BottomNav />}
        </div>
      </div>
    </CartProvider>
  );
}
