'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import { cn, formatPrice } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  PackageOpen,
  Search,
  ToggleLeft,
  Utensils,
  XCircle,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  menuItemId: string;
  menuItem: {
    name: string;
    category: string;
    price: number;
  };
  currentStock: number;
  unit: string;
  lowThreshold: number;
  isLowStock: boolean;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: 'Starters', image: '' });
  const [addingItem, setAddingItem] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  async function toggleStock(item: InventoryItem) {
    const isCurrentlyInStock = item.currentStock > 0;
    const newStock = isCurrentlyInStock ? 0 : 50;

    setTogglingId(item.id);
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStock: newStock }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((current) =>
            current.id === item.id
              ? { ...current, currentStock: newStock, isLowStock: newStock <= current.lowThreshold }
              : current
          )
        );
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category) return;
    setAddingItem(true);
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewItem({ name: '', description: '', price: '', category: 'Starters', image: '' });
        fetchInventory(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setAddingItem(false);
    }
  }

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.menuItem.category)))],
    [items]
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = item.menuItem.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesCategory =
          categoryFilter === 'all' || item.menuItem.category === categoryFilter;
        return matchesSearch && matchesCategory;
      }),
    [items, searchQuery, categoryFilter]
  );

  const inStockCount = items.filter((item) => item.currentStock > 0).length;
  const outOfStockCount = items.filter((item) => item.currentStock === 0).length;
  const lowStockCount = items.filter((item) => item.currentStock > 0 && item.isLowStock).length;
  const totalPortions = items.reduce((sum, item) => sum + item.currentStock, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Inventory" description="Loading stock levels..." />
        <div className="h-96 animate-pulse rounded-[1.4rem] bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Stock Control"
        title="Inventory"
        description="Track item availability, low-stock risk, and menu sellability from one surface."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-light transition-colors"
            >
              + Add Item
            </button>
            <Badge className="rounded-full bg-slate-950 px-4 py-2 text-white">
              {items.length} tracked items
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="In Stock" value={inStockCount} icon={CheckCircle2} tone="green" />
        <AdminStatCard label="Low Stock" value={lowStockCount} icon={AlertTriangle} tone="amber" />
        <AdminStatCard label="Out of Stock" value={outOfStockCount} icon={XCircle} tone="red" />
        <AdminStatCard label="Total Units" value={totalPortions} icon={Package} tone="blue" />
      </div>

      <AdminPanel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="rounded-2xl border-slate-200 bg-white pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={cn(
                  'rounded-full px-3.5 py-2 text-xs font-semibold transition-colors',
                  categoryFilter === category
                    ? 'bg-slate-950 text-white'
                    : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-950'
                )}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Menu Availability" description="Toggle items off when the kitchen can no longer sell them.">
        {filteredItems.length === 0 ? (
          <AdminEmptyState
            icon={PackageOpen}
            title="No matching items"
            description="Try a different search term or category."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.5fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 lg:grid">
              <span>Item</span>
              <span>Category</span>
              <span>Stock</span>
              <span>Status</span>
              <span className="text-right">Toggle</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isInStock = item.currentStock > 0;
                const isToggling = togglingId === item.id;
                const stockTone = !isInStock
                  ? 'text-rose-700 bg-rose-50 ring-rose-100'
                  : item.isLowStock
                    ? 'text-amber bg-amber/10 ring-amber/20'
                    : 'text-emerald-700 bg-emerald-50 ring-emerald-100';

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'grid gap-4 px-5 py-4 transition-colors lg:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.5fr] lg:items-center',
                      !isInStock && 'bg-rose-50/35'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <Utensils className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{item.menuItem.name}</p>
                        <p className="text-sm text-slate-400">{formatPrice(item.menuItem.price)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full">
                      {item.menuItem.category}
                    </Badge>
                    <div>
                      <p className="font-semibold text-slate-950">
                        {item.currentStock} {item.unit}
                      </p>
                      <p className="text-xs text-slate-400">Low at {item.lowThreshold}</p>
                    </div>
                    <span className={cn('w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1', stockTone)}>
                      {!isInStock ? 'Out' : item.isLowStock ? 'Low' : 'Available'}
                    </span>
                    <div className="flex justify-start lg:justify-end">
                      <button
                        onClick={() => toggleStock(item)}
                        disabled={isToggling}
                        className={cn(
                          'relative inline-flex h-8 w-16 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-amber/30',
                          isInStock ? 'bg-emerald-500' : 'bg-slate-300',
                          isToggling && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition',
                            isInStock ? 'translate-x-9' : 'translate-x-1'
                          )}
                        >
                          <ToggleLeft className="h-3.5 w-3.5" />
                        </span>
                        <span className="sr-only">
                          {isInStock ? 'Mark as out of stock' : 'Mark as in stock'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AdminPanel>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Add New Menu Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Grilled Salmon"
                  required
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-amber focus:bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Brief description of the dish"
                  required
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-amber focus:bg-white resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Price (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="12.50"
                    required
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-amber focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-amber focus:bg-white"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Grill">Grill</option>
                    <option value="Sides">Sides</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Image</label>
                <div className="mt-1">
                  {newItem.image ? (
                    <div className="relative rounded-xl overflow-hidden h-32 bg-gray-100">
                      <img src={newItem.image} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, image: '' })}
                        className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-amber hover:bg-amber/5 transition-colors">
                      <span className="text-2xl text-gray-300">📷</span>
                      <span className="mt-1 text-xs text-gray-500">Click to upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewItem({ ...newItem, image: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingItem}
                  className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {addingItem ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
