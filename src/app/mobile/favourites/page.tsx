'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Heart, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { showMobileToast as toast } from '@/hooks/use-mobile-toast';
import type { MenuItem } from '@/types';

const FAVOURITES_KEY = 'ember-grill-favourites';

export default function MobileFavouritesPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

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

  // Fetch menu items
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

  function removeFavourite(itemId: string) {
    const newFavs = new Set(favourites);
    newFavs.delete(itemId);
    setFavourites(newFavs);
    try {
      sessionStorage.setItem(FAVOURITES_KEY, JSON.stringify(Array.from(newFavs)));
    } catch {
      // ignore
    }
    toast('Removed from favourites');
  }

  function handleAdd(item: MenuItem) {
    addItem(item);
    toast(`${item.name} added`);
  }

  const favouriteItems = menuItems.filter((item) => favourites.has(item.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (favouriteItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Heart className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="font-heading text-lg font-bold text-charcoal">Favourites</h1>
        <p className="text-sm text-gray-400">
          Your favourite dishes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4">
      <h1 className="font-heading text-xl font-bold text-charcoal mb-4">Favourites</h1>

      <div className="grid grid-cols-2 gap-3">
        {favouriteItems.map((item) => (
          <div
            key={item.id}
            className={`relative flex flex-col items-center rounded-2xl bg-green-50/60 p-3 pb-4 ${
              !item.available ? 'opacity-60' : ''
            }`}
          >
            {/* Remove favourite icon */}
            <button
              className="absolute top-2 right-2 z-10"
              onClick={() => removeFavourite(item.id)}
            >
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            </button>

            {/* Circular food image */}
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white shadow-sm">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  No img
                </div>
              )}
            </div>

            {/* Item name */}
            <p className="mt-3 text-center text-xs font-semibold text-charcoal line-clamp-2 leading-tight">
              {item.name}
            </p>

            {/* Prep time + rating */}
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-400">
              <span>🍽️ 15m</span>
              <span>⭐</span>
            </div>

            {/* Unavailable label */}
            {!item.available && (
              <div className="mt-2 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-medium text-red-600">
                Not available at the moment
              </div>
            )}

            {/* Price + Add button */}
            <div className="mt-2 flex w-full items-center justify-between px-1">
              <span className="text-sm font-bold text-charcoal">
                {formatPrice(item.price)}
              </span>
              <button
                onClick={() => handleAdd(item)}
                disabled={!item.available}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-white disabled:opacity-40 active:bg-charcoal-light"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
