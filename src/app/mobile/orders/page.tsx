'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, X, ShoppingBag, MapPin, CheckCircle2, Star, Package } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useSSE } from '@/hooks/use-sse';
import { formatPrice, formatDate, getElapsedTime } from '@/lib/utils';
import { showMobileToast as toast } from '@/hooks/use-mobile-toast';
import type { Order, SSEEvent } from '@/types';

type Tab = 'cart' | 'ongoing' | 'completed';

export default function MobileOrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('cart');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [loyaltyPopup, setLoyaltyPopup] = useState<{ points: number; orderNumber: string } | null>(null);
  const [deliveredPopup, setDeliveredPopup] = useState<{ orderNumber: string } | null>(null);
  const { items, totalPrice, updateQuantity, removeItem, clearCart, addItem } = useCart();
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch { /* silently fail */ }
    finally { setLoadingOrders(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Re-fetch when tab becomes visible (user switches back)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchOrders]);

  // Poll every 5 seconds for real-time updates as a fallback
  useEffect(() => {
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'order-updated') {
      const updatedOrder = event.data;
      // Immediately update the order in state for instant UI feedback
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== updatedOrder.id) return o;
          return { ...o, ...updatedOrder, delivery: updatedOrder.delivery || o.delivery };
        })
      );
      // Check if a delivery/pickup order just became delivered/collected
      if (['delivered', 'collected'].includes(updatedOrder.status) && updatedOrder.orderType !== 'dine-in') {
        const pointsEarned = Math.floor(updatedOrder.totalAmount || 0);
        if (pointsEarned > 0) {
          setDeliveredPopup({ orderNumber: updatedOrder.orderNumber || '' });
          setTimeout(() => {
            setDeliveredPopup(null);
            setLoyaltyPopup({ points: pointsEarned, orderNumber: updatedOrder.orderNumber || '' });
            setTimeout(() => setLoyaltyPopup(null), 5000);
          }, 3000);
        }
      }
    } else if (event.type === 'delivery-updated') {
      // Immediately update delivery data in the matching order
      const deliveryData = event.data;
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === deliveryData.orderId || o.delivery?.id === deliveryData.id) {
            return { ...o, delivery: { ...o.delivery, ...deliveryData } };
          }
          return o;
        })
      );
      fetchOrders();
    } else if (event.type === 'new-order') {
      fetchOrders();
    }
  }, [fetchOrders]);

  useSSE({ onEvent: handleSSEEvent, eventTypes: ['order-updated', 'delivery-updated', 'new-order'] });

  const ongoingOrders = orders.filter((o) =>
    ['received', 'preparing', 'ready', 'out-for-delivery'].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ['delivered', 'served', 'collected'].includes(o.status)
  );

  function handleReorder(order: Order) {
    if (order.items && order.items.length > 0) {
      for (const orderItem of order.items) {
        if (orderItem.menuItem) {
          addItem(orderItem.menuItem, orderItem.quantity);
        }
      }
      toast('Items added to cart');
      router.push('/mobile/checkout');
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Uber-style top tabs — underline style, left-aligned */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-6 border-b border-gray-100">
          {([
            { key: 'cart' as Tab, label: 'Basket', count: items.length },
            { key: 'ongoing' as Tab, label: 'In Progress', count: ongoingOrders.length },
            { key: 'completed' as Tab, label: 'Past Orders', count: completedOrders.length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key ? 'text-charcoal' : 'text-gray-400'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-[10px] text-gray-400">({tab.count})</span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-charcoal" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">

        {/* BASKET */}
        {activeTab === 'cart' && (
          items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
                <ShoppingBag className="h-9 w-9 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-charcoal">Your basket is empty</p>
              <p className="text-xs text-gray-400 text-center max-w-[200px]">
                When you add items from the menu, they&apos;ll appear here
              </p>
              <Link
                href="/mobile"
                className="mt-2 rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-white"
              >
                Browse menu
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              {/* Restaurant header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber">EG</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">The Ember Grill</p>
                  <p className="text-[10px] text-gray-400">Delivery • 25-35 min</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-0 divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex items-start gap-3 py-4">
                    {/* Quantity badge */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="h-6 w-6 rounded-full border border-gray-200 flex items-center justify-center text-charcoal"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold text-charcoal">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="h-6 w-6 rounded-full border border-gray-200 flex items-center justify-center text-charcoal"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Item info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal">{item.menuItem.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.menuItem.description}</p>
                      <p className="text-sm font-semibold text-charcoal mt-1">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </p>
                    </div>

                    {/* Image + remove */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-100">
                        {item.menuItem.image && (
                          <Image src={item.menuItem.image} alt={item.menuItem.name} fill className="object-cover" sizes="56px" />
                        )}
                      </div>
                      <button
                        onClick={() => { removeItem(item.menuItem.id); toast('Removed'); }}
                        className="p-1 text-gray-300 active:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-charcoal">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Delivery fee</span>
                  <span className="font-semibold text-charcoal">£2.99</span>
                </div>
                <div className="flex justify-between text-base mt-3 pt-3 border-t border-gray-100">
                  <span className="font-bold text-charcoal">Total</span>
                  <span className="font-bold text-charcoal">{formatPrice(totalPrice + 2.99)}</span>
                </div>
              </div>

              {/* Checkout button — Uber style full-width */}
              <Link
                href="/mobile/checkout"
                className="mt-5 flex items-center justify-between w-full rounded-xl bg-charcoal px-5 py-4"
              >
                <span className="text-sm font-semibold text-white">Go to checkout</span>
                <span className="text-sm font-bold text-white">{formatPrice(totalPrice + 2.99)}</span>
              </Link>

              {/* Clear basket */}
              <button
                onClick={() => { clearCart(); toast('Basket cleared'); }}
                className="mt-3 w-full text-center text-xs text-gray-400 active:text-red-500"
              >
                Clear basket
              </button>
            </div>
          )
        )}

        {/* IN PROGRESS */}
        {activeTab === 'ongoing' && (
          loadingOrders ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          ) : ongoingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
                <MapPin className="h-9 w-9 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-charcoal">No active orders</p>
              <p className="text-xs text-gray-400 text-center">Your in-progress orders will show here</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {ongoingOrders.map((order) => {
                // Different steps for each order type
                const isDineIn = order.orderType === 'dine-in';
                const isPickup = order.orderType === 'pickup';

                const dineInSteps = [
                  { key: 'received', label: 'Order Received' },
                  { key: 'preparing', label: 'Being Prepared' },
                  { key: 'ready', label: 'Ready to Serve' },
                  { key: 'served', label: 'Served' },
                ];

                const pickupSteps = [
                  { key: 'received', label: 'Order Confirmed' },
                  { key: 'preparing', label: 'Being Prepared' },
                  { key: 'ready', label: 'Order Ready' },
                  { key: 'collected', label: 'Order Picked Up' },
                ];

                const deliverySteps = [
                  { key: 'received', label: 'Order Confirmed' },
                  { key: 'preparing', label: 'Preparing Your Order' },
                  { key: 'ready', label: 'Order Ready' },
                  { key: 'rider-assigned', label: 'Rider Assigned' },
                  { key: 'en-route-to-restaurant', label: 'Rider Heading to Restaurant' },
                  { key: 'collecting', label: 'Rider Picked Up Your Order' },
                  { key: 'en-route-to-customer', label: 'On Its Way To You' },
                ];

                const steps = isDineIn ? dineInSteps : isPickup ? pickupSteps : deliverySteps;

                // Determine current step index
                let currentIdx = -1;
                if (!isDineIn && !isPickup && order.status === 'out-for-delivery') {
                  // Use delivery sub-status if available, otherwise default to rider-assigned
                  const deliveryStatus = order.delivery?.status;
                  if (deliveryStatus && deliveryStatus !== 'pending') {
                    currentIdx = steps.findIndex((s) => s.key === deliveryStatus);
                  }
                  if (currentIdx < 0) currentIdx = 3; // Default to "Rider Assigned"
                } else {
                  currentIdx = steps.findIndex((s) => s.key === order.status);
                }

                if (currentIdx < 0) currentIdx = 0;

                const progress = ((currentIdx + 1) / steps.length) * 100;
                const currentLabel = steps[currentIdx]?.label || 'Processing';

                return (
                  <div key={order.id} className="rounded-2xl bg-white overflow-hidden shadow-sm">
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100">
                      <div
                        className="h-full bg-green-500 transition-all duration-700 rounded-r-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="p-4">
                      {/* Main status */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-charcoal">{currentLabel}</p>
                        <span className="text-[10px] font-medium text-gray-400 uppercase">
                          {isDineIn ? 'Dine-in' : order.orderType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isDineIn ? 'Table ' + order.tableNumber + ' · 15-20 min' : isPickup ? 'Ready in 15-20 min · Collect from counter' : 'Estimated: 25-35 min'}
                      </p>

                      {/* Step timeline */}
                      <div className="mt-4 space-y-2">
                        {steps.map((step, idx) => {
                          const isCompleted = idx < currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <div key={step.key} className="flex items-center gap-2.5">
                              <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                                isCompleted ? 'bg-green-500' : isCurrent ? 'bg-amber' : 'bg-gray-200'
                              }`} />
                              <span className={`text-xs ${
                                isCompleted ? 'text-green-600 font-medium' : isCurrent ? 'text-charcoal font-semibold' : 'text-gray-300'
                              }`}>
                                {step.label}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] text-amber font-medium ml-auto">Current</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Order details row */}
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-amber">EG</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-charcoal">{order.orderNumber}</p>
                            <p className="text-[10px] text-gray-400">{order.items?.length || 0} items</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-charcoal">{formatPrice(order.totalAmount)}</p>
                      </div>

                      {/* Rider info — delivery only */}
                      {!isDineIn && !isPickup && order.delivery?.riderName && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                          <div className="h-7 w-7 rounded-full bg-charcoal flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white">
                              {order.delivery.riderName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-charcoal">{order.delivery.riderName}</p>
                            <p className="text-[10px] text-gray-400">Your delivery partner</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* PAST ORDERS */}
        {activeTab === 'completed' && (
          loadingOrders ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          ) : completedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-charcoal">No past orders</p>
              <p className="text-xs text-gray-400 text-center">Completed orders will appear here</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {completedOrders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal">Delivered</p>
                      <p className="text-[10px] text-gray-400">{getElapsedTime(order.createdAt)} • {order.items?.length || 0} items</p>
                    </div>
                    <p className="text-sm font-bold text-charcoal">{formatPrice(order.totalAmount)}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setReceiptOrder(order)}
                      className="flex-1 rounded-lg bg-gray-100 py-2 text-xs font-semibold text-charcoal active:bg-gray-200"
                    >
                      View receipt
                    </button>
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex-1 rounded-lg bg-charcoal py-2 text-xs font-semibold text-white active:bg-charcoal-light"
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Receipt Modal */}
      {receiptOrder && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[320px] rounded-2xl bg-white p-5 shadow-xl max-h-[90%] overflow-y-auto">
            {/* Receipt header */}
            <div className="text-center border-b-2 border-dashed border-gray-200 pb-4">
              <p className="text-lg font-bold text-charcoal">The Ember Grill</p>
              <p className="text-[10px] text-gray-400 mt-1">Shoreditch, London</p>
            </div>

            {/* Order info */}
            <div className="border-b-2 border-dashed border-gray-200 py-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Order</span>
                <span className="font-mono font-semibold text-charcoal">{receiptOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Date</span>
                <span className="font-mono text-charcoal">{formatDate(receiptOrder.createdAt)}</span>
              </div>
            </div>

            {/* Items list */}
            <div className="border-b-2 border-dashed border-gray-200 py-3 space-y-2">
              {receiptOrder.items?.map((orderItem) => (
                <div key={orderItem.id} className="flex justify-between text-xs">
                  <span className="text-charcoal">
                    {orderItem.quantity}x {orderItem.menuItem?.name ?? 'Item'}
                  </span>
                  <span className="font-mono font-semibold text-charcoal">
                    {formatPrice(orderItem.unitPrice * orderItem.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono font-semibold text-charcoal">
                  {formatPrice(receiptOrder.totalAmount - 2.99 + receiptOrder.discountAmount)}
                </span>
              </div>
              {receiptOrder.discountAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-mono font-semibold text-green-600">
                    -{formatPrice(receiptOrder.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Delivery fee</span>
                <span className="font-mono font-semibold text-charcoal">£2.99</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="font-bold text-charcoal">Total</span>
                <span className="font-mono font-bold text-charcoal">
                  {formatPrice(receiptOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setReceiptOrder(null)}
              className="mt-3 w-full rounded-xl bg-charcoal py-3 text-sm font-semibold text-white active:bg-charcoal-light"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Order Delivered Popup */}
      {deliveredPopup && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-[280px] rounded-3xl bg-white p-6 shadow-xl text-center animate-in zoom-in-95 fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-charcoal">Order Delivered!</h3>
            <p className="mt-2 text-sm text-gray-500">Your order has arrived. Enjoy your meal!</p>
            <p className="mt-3 text-[10px] text-gray-400">Order {deliveredPopup.orderNumber}</p>
            <button
              onClick={() => setDeliveredPopup(null)}
              className="mt-5 w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white active:bg-green-700"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Loyalty Points Earned Popup */}
      {loyaltyPopup && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-[280px] rounded-3xl bg-white p-6 shadow-xl text-center animate-in zoom-in-95 fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber/10">
              <Star className="h-8 w-8 text-amber" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-charcoal">Loyalty Points Earned!</h3>
            <p className="mt-2 text-3xl font-black text-amber">+{loyaltyPopup.points}</p>
            <p className="text-xs text-gray-500 mt-1">points added to your account</p>
            <p className="mt-3 text-[10px] text-gray-400">Order {loyaltyPopup.orderNumber}</p>
            <button
              onClick={() => setLoyaltyPopup(null)}
              className="mt-5 w-full rounded-xl bg-amber py-3 text-sm font-semibold text-white active:bg-amber-light"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
