'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Mail, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dine-in/1', label: 'Dine-In' },
  { href: '/reserve', label: 'Reserve a Table' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-charcoal-light/20 bg-charcoal/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
        {/* Logo and brand */}
        <Link href="/" className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-amber" />
          <span className="font-heading text-xl font-bold text-cream">
            The Ember Grill
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-cream/70 transition-colors hover:text-amber"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Contact icon and mobile menu toggle */}
        <div className="flex items-center gap-3">
          {/* Contact icon (desktop) */}
          <Link
            href="/#contact"
            className="hidden md:flex items-center gap-2 rounded-full border border-cream/20 px-4 py-2 text-sm font-medium text-cream/80 transition-colors hover:border-amber hover:text-amber"
          >
            <Mail className="h-4 w-4" />
            Contact
          </Link>

          {/* Mobile hamburger menu */}
          <Button
            variant="ghost"
            size="icon"
            className="text-cream hover:bg-cream/5 hover:text-amber md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-cream/10 bg-charcoal/98 backdrop-blur-md px-6 pb-6 pt-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-cream/70 transition-colors hover:bg-cream/5 hover:text-amber"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
