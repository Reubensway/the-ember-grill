'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { MenuItemDetail } from '@/components/menu/MenuItemDetail';
import { useCart } from '@/hooks/use-cart';
import type { MenuItem } from '@/types';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'Starters', label: 'Starters' },
  { value: 'Mains', label: 'Mains' },
  { value: 'Grill', label: 'Grill' },
  { value: 'Sides', label: 'Sides' },
  { value: 'Desserts', label: 'Desserts' },
  { value: 'Drinks', label: 'Drinks' },
];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | number>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Failed to fetch menu');
        const data = await res.json();
        setItems(data.items);
      } catch (error) {
        console.error('Error fetching menu:', error);
        toast.error('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, []);

  const filteredItems =
    activeCategory === 'all'
      ? items
      : items.filter((item) => item.category === activeCategory);

  function handleAddToCart(item: MenuItem) {
    addItem(item);
    toast.success(`${item.name} added to cart`);
  }

  function handleItemClick(item: MenuItem) {
    setSelectedItem(item);
    setDetailOpen(true);
  }

  function handleDetailAddToCart(item: MenuItem, quantity: number) {
    addItem(item, quantity);
    toast.success(`${quantity}× ${item.name} added to cart`);
  }

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-charcoal sm:text-5xl">
            Our Menu
          </h1>
          <p className="mt-4 text-lg text-charcoal-light">
            Explore our wood-fired dishes, crafted with seasonal British ingredients
            and bold flavours.
          </p>
        </div>

        {/* Category filter buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-amber text-white shadow-sm'
                  : 'bg-white text-charcoal-light border border-gray-200 hover:border-amber hover:text-amber'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu items grid */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={handleAddToCart}
                  onItemClick={handleItemClick}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-charcoal-light">
                No items found in this category.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Item detail modal */}
      <MenuItemDetail
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToCart={handleDetailAddToCart}
      />
    </section>
  );
}
