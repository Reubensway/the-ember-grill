'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  CreditCard,
  Truck,
  UtensilsCrossed,
  ChefHat,
  Users,
  Star,
  Tag,
  QrCode,
  CalendarDays,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Slide {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  gradient: string;
  iconBg: string;
}

const slides: Slide[] = [
  {
    id: 'intro',
    icon: <Flame className="h-10 w-10" />,
    title: 'The Ember Grill',
    subtitle: 'Fully Owned Ordering System',
    description: "From the customer's first visit to the restaurant managing every order in real time — a complete end-to-end platform built for modern hospitality.",
    features: [
      'Customer-facing mobile & web ordering',
      'Real-time kitchen & delivery management',
      'Loyalty, marketing & CRM built in',
      'No third-party dependencies',
    ],
    gradient: 'from-charcoal via-charcoal-light to-charcoal',
    iconBg: 'bg-amber/20 text-amber',
  },
  {
    id: 'mobile-ordering',
    icon: <Smartphone className="h-10 w-10" />,
    title: 'Mobile Ordering',
    subtitle: 'Customer Experience',
    description: 'A native-feeling mobile interface where customers sign up, browse the menu, add to cart, and place orders for delivery or pickup.',
    features: [
      'User registration & profile management',
      'Menu browsing with category filters',
      'Cart management with quantity controls',
      'Saved delivery addresses from profile',
      'Real-time order tracking with live status updates',
    ],
    gradient: 'from-blue-900 via-blue-800 to-indigo-900',
    iconBg: 'bg-blue-400/20 text-blue-300',
  },
  {
    id: 'checkout',
    icon: <CreditCard className="h-10 w-10" />,
    title: 'Checkout & Payment',
    subtitle: 'Secure Transactions',
    description: 'A streamlined checkout flow with auto-formatting card inputs, discount code validation, and loyalty reward redemption.',
    features: [
      'Auto-formatted card number & expiry inputs',
      'Discount code validation against database',
      'Loyalty points redemption at checkout',
      'Delivery address validation (zone-restricted)',
      'Order confirmation with tracking redirect',
    ],
    gradient: 'from-emerald-900 via-emerald-800 to-teal-900',
    iconBg: 'bg-emerald-400/20 text-emerald-300',
  },
  {
    id: 'dine-in',
    icon: <UtensilsCrossed className="h-10 w-10" />,
    title: 'Dine-In Ordering',
    subtitle: 'QR Code Experience',
    description: 'Customers scan a table QR code, browse the menu, select their table, and place orders — then track preparation in real time without leaving the page.',
    features: [
      'QR code scanning opens table-specific menu',
      'Table selection at checkout',
      'Live order tracking (received → preparing → ready → served)',
      'SSE-powered real-time status updates',
      'Session persistence survives page refresh',
    ],
    gradient: 'from-orange-900 via-amber-800 to-orange-900',
    iconBg: 'bg-orange-400/20 text-orange-300',
  },
  {
    id: 'kitchen',
    icon: <ChefHat className="h-10 w-10" />,
    title: 'Kitchen Display',
    subtitle: 'Back of House',
    description: 'A real-time ticket board for chefs and service leads. Orders flow through lanes as they progress from received to ready.',
    features: [
      'Three-column Kanban: New → Preparing → Ready',
      'One-tap status progression',
      'Real-time updates via Server-Sent Events',
      'Newest orders appear first',
      'Special instructions highlighted',
    ],
    gradient: 'from-rose-900 via-pink-800 to-rose-900',
    iconBg: 'bg-rose-400/20 text-rose-300',
  },
  {
    id: 'delivery',
    icon: <Truck className="h-10 w-10" />,
    title: 'Delivery Tracking',
    subtitle: 'Stuart Simulation',
    description: 'A simulated delivery flow that mirrors real courier services. Rider assignment, pickup, transit, and delivery — all updating in real time on both admin and customer sides.',
    features: [
      'Automated rider assignment on dispatch',
      'Full status progression: assigned → en-route → collecting → delivering → delivered',
      'Real-time updates on admin dashboard',
      'Customer mobile tracks every step live',
      'Configurable simulation timings',
    ],
    gradient: 'from-violet-900 via-purple-800 to-violet-900',
    iconBg: 'bg-violet-400/20 text-violet-300',
  },
  {
    id: 'crm',
    icon: <Users className="h-10 w-10" />,
    title: 'Customer CRM',
    subtitle: 'Relationship Management',
    description: 'Every customer who places an order is tracked with their full history — orders, spend, loyalty points, and contact details.',
    features: [
      'Auto-created customer profiles on first order',
      'Order history with item details',
      'Total spend & order count tracking',
      'Loyalty points balance',
      'Search by name or email',
      'CSV export for marketing',
    ],
    gradient: 'from-cyan-900 via-cyan-800 to-sky-900',
    iconBg: 'bg-cyan-400/20 text-cyan-300',
  },
  {
    id: 'loyalty',
    icon: <Star className="h-10 w-10" />,
    title: 'Loyalty Programme',
    subtitle: 'Retention & Rewards',
    description: 'Customers earn points on every delivery and pickup order. Points can be redeemed for rewards at checkout — configured entirely from the admin panel.',
    features: [
      '1 point per £1 spent (delivery & pickup only)',
      'Configurable reward tiers from admin',
      'Redemption at mobile checkout',
      'Points deducted on use',
      '"Loyalty Points Earned" popup on delivery',
    ],
    gradient: 'from-amber-900 via-yellow-800 to-amber-900',
    iconBg: 'bg-yellow-400/20 text-yellow-300',
  },
  {
    id: 'marketing',
    icon: <Tag className="h-10 w-10" />,
    title: 'Marketing & Discounts',
    subtitle: 'Promotions Engine',
    description: 'Create and manage discount codes from the admin panel. Codes are validated in real time at checkout with usage limits and expiry dates.',
    features: [
      'Percentage or fixed-amount discounts',
      'Usage limits & expiry dates',
      'Real-time validation at checkout',
      'Live promo banners on mobile home screen',
      'New codes appear within 30 seconds',
    ],
    gradient: 'from-fuchsia-900 via-pink-800 to-fuchsia-900',
    iconBg: 'bg-fuchsia-400/20 text-fuchsia-300',
  },
  {
    id: 'reservations',
    icon: <CalendarDays className="h-10 w-10" />,
    title: 'Table Reservations',
    subtitle: 'Booking System',
    description: 'Customers book tables online with automatic availability checking and table assignment. Alternative time suggestions when slots are full.',
    features: [
      'Date, time & party size selection',
      'Automatic table assignment',
      'Capacity checking (12 tables)',
      'Alternative time suggestions on conflict',
      'Confirmation with reference number',
    ],
    gradient: 'from-slate-800 via-slate-700 to-slate-800',
    iconBg: 'bg-slate-400/20 text-slate-300',
  },
  {
    id: 'qr-codes',
    icon: <QrCode className="h-10 w-10" />,
    title: 'QR Code Management',
    subtitle: 'Table Setup',
    description: 'Generate QR codes for each table from the admin panel. Add or remove tables dynamically — each code links directly to the dine-in ordering flow.',
    features: [
      'Dynamic table count management',
      'Instant QR code generation',
      'Print-ready layout',
      'Direct link to dine-in ordering',
      'Persistent table configuration',
    ],
    gradient: 'from-gray-900 via-gray-800 to-gray-900',
    iconBg: 'bg-gray-400/20 text-gray-300',
  },
  {
    id: 'realtime',
    icon: <BarChart3 className="h-10 w-10" />,
    title: 'Real-Time Architecture',
    subtitle: 'Technical Foundation',
    description: 'The entire platform is connected via Server-Sent Events. Every status change broadcasts instantly to all connected clients — no polling, no refresh needed.',
    features: [
      'Server-Sent Events (SSE) for live updates',
      'Automatic reconnection with exponential backoff',
      'Visibility-based refetch on tab switch',
      'Polling fallback for reliability',
      'Works across admin, mobile & dine-in simultaneously',
    ],
    gradient: 'from-indigo-900 via-indigo-800 to-blue-900',
    iconBg: 'bg-indigo-400/20 text-indigo-300',
  },
];

export default function IntroPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const slide = slides[currentSlide];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${slide.gradient} transition-all duration-700 flex flex-col`}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-amber" />
          <span className="font-heading text-sm font-bold text-white/80">The Ember Grill</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40 hidden sm:block">
            {currentSlide + 1} / {slides.length}
          </span>
          <Link
            href="/"
            className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/70 hover:bg-white/20 transition"
          >
            Exit Intro
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full max-w-4xl"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              {/* Left: Icon + Title */}
              <div>
                <div className={`inline-flex h-20 w-20 items-center justify-center rounded-3xl ${slide.iconBg}`}>
                  {slide.icon}
                </div>
                <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-white/40">
                  {slide.subtitle}
                </p>
                <h1 className="mt-2 font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>
                <p className="mt-5 text-base leading-relaxed text-white/60 max-w-md">
                  {slide.description}
                </p>
              </div>

              {/* Right: Features */}
              <div className="rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-5">
                  Key Features
                </p>
                <ul className="space-y-4">
                  {slide.features.map((feature, idx) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.08 }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-1 h-2 w-2 rounded-full bg-amber flex-shrink-0" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-md border-t border-white/5">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-4 sm:px-10">
          {/* Prev */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-20 hover:bg-white/20 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-6 bg-amber'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Next */}
          {currentSlide < slides.length - 1 ? (
            <button
              onClick={nextSlide}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-light transition"
            >
              Enter App
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
