'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { MenuItemDetail } from '@/components/menu/MenuItemDetail';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { useCart } from '@/hooks/use-cart';
import { useSSE } from '@/hooks/use-sse';
import { brand, TOTAL_TABLES } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';
import type { MenuItem, Order, OrderStatus, SSEEvent } from '@/types';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Flame,
  ArrowLeft,
  Sparkles,
  Armchair,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'Starters', label: 'Starters' },
  { value: 'Mains', label: 'Mains' },
  { value: 'Grill', label: 'Grill' },
  { value: 'Sides', label: 'Sides' },
  { value: 'Desserts', label: 'Desserts' },
  { value: 'Drinks', label: 'Drinks' },
];

const DINE_IN_STATUSES: OrderStatus[] = ['received', 'preparing', 'ready', 'served'];

type ViewState = 'menu' | 'cart' | 'submitting' | 'tracking';

export default function DineInPage() {
  const params = useParams();
  const tableId = Array.isArray(params.tableId) ? params.tableId[0] : (params.tableId as string);
  const defaultTable = parseInt(tableId || '0', 10) || null;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [view, setView] = useState<ViewState>('menu');
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(defaultTable);

  const { items, totalItems, totalPrice, addItem, updateQuantity, removeItem, clearCart } = useCart();

  // Restore tracking state from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('dine_in_order');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only restore if the order isn't served yet (or was served recently)
        if (parsed && parsed.id) {
          setOrder(parsed);
          setView('tracking');
          setSelectedTable(parsed.tableNumber ?? defaultTable);
        }
      } catch { /* ignore */ }
    }
  }, [defaultTable]);

  // Persist order to sessionStorage whenever it changes
  useEffect(() => {
    if (order && view === 'tracking') {
      sessionStorage.setItem('dine_in_order', JSON.stringify(order));
    }
  }, [order, view]);

  // Clear stored order when it's served and user navigates away
  function clearTracking() {
    sessionStorage.removeItem('dine_in_order');
    setOrder(null);
    setView('menu');
  }

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Failed to fetch menu');
        const data = await res.json();
        setMenuItems(data.items);
      } catch (error) {
        console.error('Error fetching menu:', error);
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const handleSSEEvent = useCallback(
    (event: SSEEvent) => {
      if (event.type === 'order-updated') {
        // Update if this event is for our tracked order
        setOrder((prev) => {
          if (prev && event.data?.id === prev.id) {
            return { ...prev, status: event.data.status as OrderStatus };
          }
          return prev;
        });
      }
    },
    []
  );

  useSSE({
    onEvent: handleSSEEvent,
    eventTypes: ['order-updated'],
  });

  // Polling fallback: re-fetch order status every 5s while tracking
  useEffect(() => {
    if (view !== 'tracking' || !order) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          const current = (data.orders || []).find((o: Order) => o.id === order.id);
          if (current && current.status !== order.status) {
            setOrder((prev) => prev ? { ...prev, status: current.status } : prev);
          }
        }
      } catch { /* ignore polling errors */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [view, order]);

  // Re-fetch on tab visibility change
  useEffect(() => {
    if (view !== 'tracking' || !order) return;
    function handleVisibility() {
      if (document.visibilityState === 'visible' && order) {
        fetch('/api/orders').then(res => res.json()).then(data => {
          const current = (data.orders || []).find((o: Order) => o.id === order.id);
          if (current && current.status !== order.status) {
            setOrder((prev) => prev ? { ...prev, status: current.status } : prev);
          }
        }).catch(() => {});
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [view, order]);

  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  function handleAddToCart(item: MenuItem) {
    addItem(item);
    toast.success(`${item.name} added to order`);
  }

  function handleItemClick(item: MenuItem) {
    setSelectedItem(item);
    setDetailOpen(true);
  }

  function handleDetailAddToCart(item: MenuItem, quantity: number) {
    addItem(item, quantity);
    toast.success(`${quantity}× ${item.name} added to order`);
  }

  async function handlePlaceOrder() {
    if (items.length === 0) return;
    if (!selectedTable) {
      toast.error('Please select your table number');
      return;
    }

    setSubmitting(true);
    setView('submitting');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `Table ${selectedTable} Guest`,
          orderType: 'dine-in',
          tableNumber: selectedTable,
          items: items.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const data = await res.json();
      setOrder(data.order);
      clearCart();
      setView('tracking');
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
      setView('cart');
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusIndex(status: OrderStatus): number {
    return DINE_IN_STATUSES.indexOf(status);
  }

  // Shared header
  const header = (
    <header className="sticky top-0 z-50 bg-charcoal/95 backdrop-blur-md border-b border-white/5">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/15">
            <Flame className="h-4.5 w-4.5 text-amber" />
          </div>
          <div>
            <h1 className="font-heading text-base font-bold text-cream">
              {brand.name}
            </h1>
            <p className="text-xs text-cream/50">
              {selectedTable ? `Table ${selectedTable} · ` : ''}Dine-in
            </p>
          </div>
        </div>
        {view === 'menu' && totalItems > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Button
              onClick={() => setView('cart')}
              className="relative rounded-2xl bg-amber px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber/25 hover:bg-amber-light"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              View Order
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                {totalItems}
              </span>
            </Button>
          </motion.div>
        )}
      </div>
    </header>
  );

  // Menu view
  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-cream">
        {header}
        <main className="mx-auto max-w-5xl px-4 py-6">
          {/* Welcome banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl bg-gradient-to-r from-charcoal to-charcoal-light p-5"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber" />
              <div>
                <p className="text-sm font-semibold text-cream">Welcome to {brand.name}</p>
                <p className="text-xs text-cream/60">Browse our menu and order when you&apos;re ready</p>
              </div>
            </div>
          </motion.div>

          {/* Category filter */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  activeCategory === cat.value
                    ? 'bg-charcoal text-white shadow-md'
                    : 'bg-white text-charcoal-light border border-gray-200 hover:border-amber hover:text-amber'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-2xl bg-white p-4">
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <p className="col-span-full py-12 text-center text-charcoal-light">
                  No items found in this category.
                </p>
              )}
            </div>
          )}
        </main>

        {/* Floating cart bar */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:hidden"
            >
              <button
                onClick={() => setView('cart')}
                className="flex w-full items-center justify-between rounded-2xl bg-charcoal px-5 py-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-xs font-bold text-white">
                    {totalItems}
                  </div>
                  <span className="text-sm font-semibold text-cream">View your order</span>
                </div>
                <span className="text-sm font-bold text-amber">{formatPrice(totalPrice)}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <MenuItemDetail
          item={selectedItem}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onAddToCart={handleDetailAddToCart}
        />
      </div>
    );
  }

  // Cart view with table selection
  if (view === 'cart') {
    return (
      <div className="min-h-screen bg-cream">
        {header}
        <main className="mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setView('menu')}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-charcoal" />
            </button>
            <h2 className="font-heading text-2xl font-bold text-charcoal">
              Your Order
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white py-16 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream">
                <ShoppingBag className="h-7 w-7 text-charcoal/30" />
              </div>
              <p className="font-medium text-charcoal">Your order is empty</p>
              <p className="text-sm text-charcoal-light/60">Add items from the menu to get started</p>
              <Button
                onClick={() => setView('menu')}
                className="mt-2 rounded-2xl bg-amber px-6 text-white hover:bg-amber-light"
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <>
              {/* Order items */}
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.menuItem.id}
                      layout
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 border-b border-gray-100 py-4 last:border-0 last:pb-0 first:pt-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal truncate">
                          {item.menuItem.name}
                        </p>
                        <p className="text-sm text-charcoal-light/60">
                          {formatPrice(item.menuItem.price)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream text-charcoal transition-colors hover:bg-amber/10"
                          aria-label={`Decrease quantity of ${item.menuItem.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-charcoal">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream text-charcoal transition-colors hover:bg-amber/10"
                          aria-label={`Increase quantity of ${item.menuItem.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="w-16 text-right text-sm font-bold text-charcoal">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </p>

                      <button
                        onClick={() => removeItem(item.menuItem.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.menuItem.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Table selection */}
              <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Armchair className="h-4.5 w-4.5 text-amber" />
                  <h3 className="text-sm font-semibold text-charcoal">Select Your Table</h3>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map((table) => (
                    <button
                      key={table}
                      type="button"
                      onClick={() => setSelectedTable(table)}
                      className={cn(
                        'flex h-12 items-center justify-center rounded-xl text-sm font-semibold transition-all',
                        selectedTable === table
                          ? 'bg-amber text-white shadow-md shadow-amber/30 scale-105'
                          : 'bg-cream text-charcoal hover:bg-amber/10 hover:scale-105'
                      )}
                    >
                      {table}
                    </button>
                  ))}
                </div>
                {!selectedTable && (
                  <p className="mt-3 text-xs text-amber">Please select your table number to place the order</p>
                )}
              </div>

              {/* Summary */}
              <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-light">Subtotal</span>
                  <span className="text-lg font-bold text-charcoal">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-charcoal-light/50">
                  Payment will be collected at your table after your meal.
                </p>
              </div>

              {/* Place order */}
              <Button
                onClick={handlePlaceOrder}
                disabled={submitting || !selectedTable}
                className="mt-5 w-full rounded-2xl bg-amber py-6 text-base font-semibold text-white shadow-lg shadow-amber/25 hover:bg-amber-light disabled:opacity-50"
              >
                {selectedTable
                  ? `Place Order · Table ${selectedTable} — ${formatPrice(totalPrice)}`
                  : 'Select a table to continue'}
              </Button>
            </>
          )}
        </main>
      </div>
    );
  }

  // Submitting state
  if (view === 'submitting') {
    return (
      <div className="flex min-h-screen flex-col bg-cream">
        {header}
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-12 w-12 text-amber" />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-semibold text-charcoal">Sending to kitchen...</p>
            <p className="mt-1 text-sm text-charcoal-light/60">This will only take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Order tracking view — customer stays here until served
  if (view === 'tracking' && order) {
    const currentStatusIndex = getStatusIndex(order.status);
    const isServed = order.status === 'served';

    return (
      <div className="min-h-screen bg-cream">
        {header}
        <main className="mx-auto max-w-2xl px-4 py-8">
          {/* Success banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'rounded-3xl p-8 text-center shadow-sm',
              isServed
                ? 'bg-gradient-to-br from-amber/10 to-amber/5'
                : 'bg-gradient-to-br from-green-50 to-emerald-50'
            )}
          >
            <div className={cn(
              'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
              isServed ? 'bg-amber/20' : 'bg-green-100'
            )}>
              {isServed ? (
                <UtensilsCrossed className="h-8 w-8 text-amber" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              )}
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold text-charcoal">
              {isServed ? 'Enjoy Your Meal!' : 'Order Confirmed!'}
            </h2>
            <p className="mt-2 text-charcoal-light/70">
              {isServed
                ? 'Your food has been served. Bon appétit!'
                : 'Your order is being prepared by our chefs'}
            </p>
            <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
              <span className="text-xs text-charcoal-light">Order</span>
              <span className="text-sm font-bold text-charcoal">{order.orderNumber}</span>
              <span className="text-xs text-charcoal-light">·</span>
              <span className="text-xs text-charcoal-light">Table {order.tableNumber}</span>
            </div>
          </motion.div>

          {/* Live status notice */}
          {!isServed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-amber/20 bg-amber/5 p-3"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber" />
              </span>
              <span className="text-xs font-medium text-charcoal-light">
                Live tracking — this page updates automatically
              </span>
            </motion.div>
          )}

          {/* Progress tracker */}
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-charcoal">
                Order Progress
              </h3>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="relative">
              {/* Progress bar background */}
              <div className="absolute left-[15px] top-0 h-full w-0.5 bg-gray-100" />
              {/* Active progress */}
              <div
                className="absolute left-[15px] top-0 w-0.5 bg-green-500 transition-all duration-700 ease-out"
                style={{ height: `${(currentStatusIndex / (DINE_IN_STATUSES.length - 1)) * 100}%` }}
              />

              <div className="relative space-y-6">
                {DINE_IN_STATUSES.map((status, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <motion.div
                      key={status}
                      className="flex items-center gap-4"
                      animate={isCurrent ? { x: [0, 2, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div
                        className={cn(
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500',
                          isCompleted
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-200 bg-white text-gray-400',
                          isCurrent && 'ring-4 ring-green-100'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          isCompleted ? 'text-charcoal' : 'text-charcoal-light/50',
                          isCurrent && 'font-bold'
                        )}>
                          {status === 'received' && 'Order Received'}
                          {status === 'preparing' && 'Being Prepared'}
                          {status === 'ready' && 'Ready to Serve'}
                          {status === 'served' && 'Served'}
                        </p>
                        {isCurrent && !isServed && (
                          <p className="text-xs text-amber">In progress...</p>
                        )}
                        {status === 'served' && isServed && (
                          <p className="text-xs text-green-600">Complete</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {!isServed && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber/5 p-3">
                <Clock className="h-4 w-4 text-amber" />
                <span className="text-xs text-charcoal-light">Estimated: 15-25 minutes</span>
              </div>
            )}
          </div>

          {/* Order items */}
          <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
              Items Ordered
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cream text-xs font-bold text-charcoal">
                      {item.quantity}×
                    </span>
                    <span className="text-sm font-medium text-charcoal">{item.menuItem.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-charcoal">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="font-semibold text-charcoal">Total</span>
              <span className="text-lg font-bold text-amber">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Order more (only show after served) */}
          {isServed && (
            <Button
              onClick={clearTracking}
              variant="outline"
              className="mt-6 w-full rounded-2xl border-charcoal/10 py-5 text-charcoal hover:bg-charcoal/5"
            >
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              Order More Items
            </Button>
          )}
        </main>
      </div>
    );
  }

  return null;
}
