'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, QrCode, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useSSE } from '@/hooks/use-sse';
import { showMobileToast as toast } from '@/hooks/use-mobile-toast';
import type { MenuItem, Order, OrderStatus, SSEEvent } from '@/types';

type ViewState = 'menu' | 'submitting' | 'tracking';

const DINE_IN_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'received', label: 'Order Received' },
  { key: 'preparing', label: 'Being Prepared' },
  { key: 'ready', label: 'Ready to Serve' },
  { key: 'served', label: 'Served' },
];

export default function MobileDineInPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState('5');
  const [view, setView] = useState<ViewState>('menu');
  const [order, setOrder] = useState<Order | null>(null);
  const { items, totalPrice, addItem, clearCart } = useCart();
  const router = useRouter();

  // Restore tracking state from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('mobile_dine_in_order');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.status !== 'served') {
          setOrder(parsed);
          setView('tracking');
          setTableNumber(String(parsed.tableNumber || '5'));
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Persist order to sessionStorage
  useEffect(() => {
    if (order && view === 'tracking') {
      sessionStorage.setItem('mobile_dine_in_order', JSON.stringify(order));
    }
  }, [order, view]);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data.items ?? []);
        }
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    fetchMenu();
  }, []);

  // SSE for real-time order updates
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'order-updated') {
      setOrder((prev) => {
        if (prev && event.data?.id === prev.id) {
          return { ...prev, status: event.data.status as OrderStatus };
        }
        return prev;
      });
    }
  }, []);

  useSSE({ onEvent: handleSSEEvent, eventTypes: ['order-updated'] });

  // Polling fallback every 5 seconds while tracking
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
      } catch { /* ignore */ }
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

  async function handlePlaceOrder() {
    if (items.length === 0) {
      toast('Add items to your order first');
      return;
    }
    setView('submitting');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `Table ${tableNumber} Guest`,
          orderType: 'dine-in',
          tableNumber: parseInt(tableNumber, 10),
          items: items.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        clearCart();
        setView('tracking');
        toast('Order placed!');
      } else {
        toast('Failed to place order');
        setView('menu');
      }
    } catch {
      toast('Something went wrong');
      setView('menu');
    }
  }

  function handleDone() {
    sessionStorage.removeItem('mobile_dine_in_order');
    setOrder(null);
    setView('menu');
  }

  // Submitting state
  if (view === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-amber" />
        <p className="text-sm font-medium text-gray-700">Placing your order...</p>
      </div>
    );
  }

  // Tracking state — real-time order progress
  if (view === 'tracking' && order) {
    const currentIdx = DINE_IN_STEPS.findIndex((s) => s.key === order.status);
    const isServed = order.status === 'served';

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Order Tracking</h1>
            <p className="text-xs text-gray-500">Table {order.tableNumber} · {order.orderNumber}</p>
          </div>
          {!isServed && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[10px] font-medium text-green-700">Live</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Status banner */}
          <div className={`rounded-2xl p-5 text-center ${isServed ? 'bg-amber/5' : 'bg-green-50'}`}>
            <CheckCircle2 className={`mx-auto h-12 w-12 ${isServed ? 'text-amber' : 'text-green-500'}`} />
            <h2 className="mt-3 text-lg font-bold text-gray-900">
              {isServed ? 'Enjoy Your Meal!' : 'Order Confirmed!'}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {isServed ? 'Your food has been served' : 'Your order is being prepared'}
            </p>
          </div>

          {/* Progress steps */}
          <div className="mt-6 rounded-2xl bg-gray-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</p>
              {!isServed && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>15-20 min</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {DINE_IN_STEPS.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 transition-all ${
                      isCompleted ? 'bg-green-500' : isCurrent ? 'bg-amber' : 'bg-gray-200'
                    }`} />
                    <span className={`text-sm ${
                      isCompleted ? 'text-green-600 font-medium' : isCurrent ? 'text-gray-900 font-semibold' : 'text-gray-300'
                    }`}>
                      {step.label}
                    </span>
                    {isCurrent && !isServed && (
                      <span className="ml-auto text-[10px] text-amber font-medium">Current</span>
                    )}
                    {step.key === 'served' && isServed && (
                      <span className="ml-auto text-[10px] text-green-600 font-medium">Done ✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order items */}
          {order.items && order.items.length > 0 && (
            <div className="mt-4 rounded-2xl bg-gray-50 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.quantity}× {item.menuItem?.name || 'Item'}</span>
                    <span className="font-medium text-gray-900">{formatPrice(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-amber">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Done button — only after served */}
          {isServed && (
            <button
              onClick={handleDone}
              className="mt-6 w-full rounded-2xl bg-gray-900 py-4 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Done — Back to Menu
            </button>
          )}
        </div>
      </div>
    );
  }

  // Menu view
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Dine-In Order</h1>
          <p className="text-xs text-gray-500">Table {tableNumber}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5">
          <QrCode className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">Table {tableNumber}</span>
        </div>
      </div>

      {/* Table selector */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Table:</span>
          <select
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-900"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>Table {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu items */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-gray-100 h-20" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {menuItems.filter(i => i.available).map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
                </div>
                <button
                  onClick={() => { addItem(item); toast(`${item.name} added`); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar — place order */}
      {items.length > 0 && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <button
            onClick={handlePlaceOrder}
            className="w-full flex items-center justify-between rounded-2xl bg-gray-900 px-5 py-4"
          >
            <div>
              <p className="text-xs text-gray-400">Place Order</p>
              <p className="text-sm font-bold text-white">{items.length} items</p>
            </div>
            <span className="text-sm font-bold text-white">{formatPrice(totalPrice)}</span>
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-2">No payment needed — pay at table</p>
        </div>
      )}
    </div>
  );
}
