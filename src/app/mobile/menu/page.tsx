'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types';

export default function MobileMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          const items: MenuItem[] = data.items ?? data.menuItems ?? [];
          setMenuItems(items);
          const cats = Array.from(new Set(items.map((i) => i.category)));
          setCategories(['All', ...cats]);
        }
      } catch {
        // silently fail
      }
    }
    fetchMenu();
  }, []);

  const filteredItems =
    activeCategory === 'All'
      ? menuItems
      : menuItems.filter((i) => i.category === activeCategory);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <h1 className="font-heading text-xl font-bold text-charcoal">Menu</h1>

      {/* Horizontal scrollable category pills */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? 'bg-amber text-white'
                : 'bg-white text-charcoal-light border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu items list */}
      <div className="flex flex-col gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ${
              !item.available ? 'opacity-50' : ''
            }`}
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-cream-dark">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-charcoal-light">
                  No img
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-charcoal">
                {item.name}
              </p>
              <p className="text-xs text-charcoal-light line-clamp-2">
                {item.description}
              </p>
              <p className="mt-1 text-sm font-semibold text-amber">
                {formatPrice(item.price)}
              </p>
            </div>
            <button
              disabled={!item.available}
              onClick={() => addItem(item)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber text-white disabled:opacity-40 active:bg-amber-light"
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <p className="py-8 text-center text-sm text-charcoal-light">
            No items found
          </p>
        )}
      </div>
    </div>
  );
}
