'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, Plus, Heart, Search, Bell, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { showMobileToast as toast } from '@/hooks/use-mobile-toast';
import type { MenuItem } from '@/types';

const CATEGORIES = ['All', 'Starters', 'Mains', 'Grill', 'Sides', 'Desserts', 'Drinks'];
const FAVOURITES_KEY = 'ember-grill-favourites';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function MobileHomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [discountCodes, setDiscountCodes] = useState<{ code: string; type: string; value: number }[]>([]);
  const { addItem } = useCart();
  const router = useRouter();

  // Hydrate favourites from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(FAVOURITES_KEY);
      if (stored) {
        setFavourites(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist favourites to sessionStorage
  const persistFavourites = useCallback((newFavs: Set<string>) => {
    setFavourites(newFavs);
    try {
      sessionStorage.setItem(FAVOURITES_KEY, JSON.stringify(Array.from(newFavs)));
    } catch {
      // ignore
    }
  }, []);

  function toggleFavourite(itemId: string) {
    const newFavs = new Set(favourites);
    if (newFavs.has(itemId)) {
      newFavs.delete(itemId);
      toast('Removed from favourites');
    } else {
      newFavs.add(itemId);
      toast('Added to favourites');
    }
    persistFavourites(newFavs);
  }

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data.items ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  // Fetch active discount codes for promo banners
  useEffect(() => {
    async function fetchCodes() {
      try {
        const res = await fetch('/api/discount-codes');
        if (res.ok) {
          const data = await res.json();
          const active = (data.codes || []).filter((c: { active: boolean }) => c.active);
          setDiscountCodes(active);
        }
      } catch { /* ignore */ }
    }
    fetchCodes();
    // Poll every 30s to pick up new codes in real-time
    const interval = setInterval(fetchCodes, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleAdd(item: MenuItem) {
    addItem(item);
    toast(`${item.name} added`);
  }

  function handleOrderNow(item: MenuItem) {
    addItem(item);
    toast(`${item.name} added to cart`);
    setSelectedItem(null);
    router.push('/mobile/checkout');
  }

  return (
    <div className="flex flex-col px-4 py-4 bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__toggleMobileSideMenu) {
              ((window as unknown as Record<string, unknown>).__toggleMobileSideMenu as () => void)();
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        <button
          onClick={() => router.push('/mobile/notifications')}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          <div className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
        </button>
      </div>

      {/* Greeting */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">{getGreeting()} 👋</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          What are you craving?
        </h1>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-3 mb-5">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search dishes, drinks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
        />
      </div>

      {/* Promotional banners — live discount codes */}
      {discountCodes.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
          {discountCodes.map((dc, i) => {
            const gradients = [
              'from-orange-500 to-amber-500',
              'from-rose-500 to-pink-500',
              'from-violet-500 to-purple-500',
              'from-emerald-500 to-teal-500',
              'from-blue-500 to-indigo-500',
            ];
            const gradient = gradients[i % gradients.length];
            return (
              <div key={dc.code} className={`flex-shrink-0 w-[260px] rounded-2xl bg-gradient-to-r ${gradient} p-4 text-white shadow-md`}>
                <p className="text-xs font-medium opacity-90">Limited offer</p>
                <p className="text-base font-bold mt-1">
                  {dc.type === 'percentage' ? `${dc.value}% off your order` : `£${dc.value} off your order`}
                </p>
                <p className="text-xs mt-2 opacity-80 font-mono">Use code: {dc.code}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu items — horizontal cards in vertical list */}
      <div className="mt-4 flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-gray-100 h-24" />
            ))
          : filteredItems.map((item) => (
              <div
                key={item.id}
                className={`relative flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm border border-gray-100 ${
                  !item.available ? 'opacity-60' : ''
                }`}
              >
                {/* Square rounded image */}
                <button
                  onClick={() => setSelectedItem(item)}
                  className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      No img
                    </div>
                  )}
                </button>

                {/* Details */}
                <button
                  onClick={() => setSelectedItem(item)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1.5">
                    {formatPrice(item.price)}
                  </p>
                  {!item.available && (
                    <span className="inline-block mt-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                      Unavailable
                    </span>
                  )}
                </button>

                {/* Right actions */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  {/* Favourite */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavourite(item.id);
                    }}
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        favourites.has(item.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                  {/* Add button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd(item);
                    }}
                    disabled={!item.available}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white disabled:opacity-40 active:scale-95 transition-transform"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
      </div>

      {filteredItems.length === 0 && !loading && (
        <p className="mt-8 text-center text-sm text-gray-400">No items found</p>
      )}

      {/* Food Detail Modal */}
      {selectedItem && (
        <div className="absolute inset-0 z-[100] flex flex-col bg-white overflow-y-auto">
          {/* Close button */}
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 left-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
          >
            <X className="h-4 w-4 text-gray-700" />
          </button>

          {/* Favourite button */}
          <button
            onClick={() => toggleFavourite(selectedItem.id)}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                favourites.has(selectedItem.id)
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-400'
              }`}
            />
          </button>

          {/* Large food image */}
          <div className="relative h-64 w-full bg-gray-100 shrink-0">
            {selectedItem.image ? (
              <Image
                src={selectedItem.image}
                alt={selectedItem.name}
                fill
                className="object-cover"
                sizes="375px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 px-5 pt-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedItem.name}
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {selectedItem.description}
            </p>
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {formatPrice(selectedItem.price)}
            </p>

            {!selectedItem.available && (
              <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                This item is currently unavailable
              </div>
            )}
          </div>

          {/* Bottom buttons */}
          <div className="px-5 pb-6 pt-2 space-y-3 shrink-0">
            <button
              onClick={() => {
                handleAdd(selectedItem);
                setSelectedItem(null);
              }}
              disabled={!selectedItem.available}
              className="w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Add to Cart
            </button>
            <button
              onClick={() => handleOrderNow(selectedItem)}
              disabled={!selectedItem.available}
              className="w-full rounded-2xl border-2 border-gray-900 py-3.5 text-sm font-semibold text-gray-900 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Order Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
