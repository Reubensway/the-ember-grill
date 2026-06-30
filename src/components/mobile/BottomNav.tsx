'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Heart, User } from 'lucide-react';

const tabs = [
  { href: '/mobile', label: 'Home', icon: Home },
  { href: '/mobile/orders', label: 'Orders', icon: ClipboardList },
  { href: '/mobile/favourites', label: 'Favourites', icon: Heart },
  { href: '/mobile/profile', label: 'Account', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white px-2 py-3 border-t border-gray-100">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === '/mobile'
            ? pathname === '/mobile'
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-charcoal'
                : 'text-gray-400'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-charcoal' : 'text-gray-400'}`} />
            {isActive && <span>{tab.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
