'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { brand } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  Truck,
  CalendarDays,
  Package,
  Users,
  Heart,
  Megaphone,
  QrCode,
  Menu,
  X,
  Flame,
  Search,
  Bell,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { label: 'Kitchen', href: '/admin/kitchen', icon: ChefHat },
  { label: 'Delivery', href: '/admin/delivery', icon: Truck },
  { label: 'Reservations', href: '/admin/reservations', icon: CalendarDays },
  { label: 'Inventory', href: '/admin/inventory', icon: Package },
  { label: 'CRM', href: '/admin/customers', icon: Users },
  { label: 'Loyalty', href: '/admin/loyalty', icon: Heart },
  { label: 'Marketing', href: '/admin/marketing', icon: Megaphone },
  { label: 'QR Codes', href: '/admin/qr-codes', icon: QrCode },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip auth check for the login page itself
    if (pathname.startsWith('/admin/login')) {
      setAuthenticated(true);
      return;
    }

    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    if (!isAuth) {
      router.replace('/admin/login');
    } else {
      setAuthenticated(true);
    }
  }, [pathname, router]);

  function handleSignOut() {
    sessionStorage.removeItem('admin_authenticated');
    router.replace('/admin/login');
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  // For the login page, render children directly (login has its own layout)
  if (pathname.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  // Show nothing while checking auth
  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-[#f6f3ec] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(202,138,4,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_32%)]" />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-24 items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber text-white shadow-lg shadow-amber/20">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold leading-tight">
                {brand.name}
              </p>
              <p className="text-xs font-medium text-white/45">
                Operations Console
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-5">
          <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Workspaces
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                      active
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-white/62 hover:bg-white/8 hover:text-white'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        active ? 'text-amber' : 'text-white/38 group-hover:text-amber'
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/62 transition-all hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-5 w-5 text-white/38" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-[#f6f3ec]/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-2xl border border-white/80 bg-white/70 px-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-amber/40 focus:ring-2 focus:ring-amber/15"
                placeholder="Search orders, guests, tables..."
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/75 text-slate-500 shadow-sm transition hover:text-slate-950">
                <Bell className="h-4 w-4" />
              </button>
              <div className="hidden items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-3 py-2 shadow-sm sm:flex">
                <div className="h-8 w-8 rounded-full bg-slate-950 text-center text-xs font-bold leading-8 text-white">
                  EG
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none text-slate-900">
                    Floor Manager
                  </p>
                  <p className="mt-1 text-xs leading-none text-slate-400">
                    Shoreditch
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
