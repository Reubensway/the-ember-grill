'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import { useSSE } from '@/hooks/use-sse';
import { cn, formatPrice, getElapsedTime } from '@/lib/utils';
import type { DeliveryStatus, Order, SSEEvent } from '@/types';
import {
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  PackageCheck,
  Play,
  Route,
  Truck,
  User,
} from 'lucide-react';

const DELIVERY_STEPS: { status: DeliveryStatus; label: string }[] = [
  { status: 'rider-assigned', label: 'Rider assigned' },
  { status: 'en-route-to-restaurant', label: 'To restaurant' },
  { status: 'collecting', label: 'Collecting' },
  { status: 'en-route-to-customer', label: 'To customer' },
  { status: 'delivered', label: 'Delivered' },
];

function getDeliveryStatusColor(status: DeliveryStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-slate-100 text-slate-600 ring-slate-200';
    case 'rider-assigned':
      return 'bg-blue-50 text-blue-700 ring-blue-100';
    case 'en-route-to-restaurant':
      return 'bg-indigo-50 text-indigo-700 ring-indigo-100';
    case 'collecting':
      return 'bg-amber/10 text-amber ring-amber/20';
    case 'en-route-to-customer':
      return 'bg-violet-50 text-violet-700 ring-violet-100';
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  }
}

function DeliveryTimeline({ status }: { status: DeliveryStatus }) {
  const currentIndex = DELIVERY_STEPS.findIndex((step) => step.status === status);

  return (
    <div className="space-y-0">
      {DELIVERY_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.status} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-3 w-3 rounded-full border-2',
                  isCompleted && 'border-emerald-500 bg-emerald-500',
                  isCurrent && 'border-amber bg-amber',
                  !isCompleted && !isCurrent && 'border-slate-300 bg-white'
                )}
              />
              {index < DELIVERY_STEPS.length - 1 && (
                <div className={cn('h-7 w-0.5', isCompleted ? 'bg-emerald-500' : 'bg-slate-200')} />
              )}
            </div>
            <span
              className={cn(
                '-mt-1 text-xs',
                isCompleted && 'font-medium text-emerald-700',
                isCurrent && 'font-semibold text-amber',
                !isCompleted && !isCurrent && 'text-slate-400'
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingDelivery, setStartingDelivery] = useState<string | null>(null);

  const fetchDeliveryOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?orderType=delivery');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch delivery orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryOrders();
  }, [fetchDeliveryOrders]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'order-updated') {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === event.data.id
            ? { ...order, ...event.data, delivery: event.data.delivery ?? order.delivery }
            : order
        )
      );
    } else if (event.type === 'delivery-updated') {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.delivery?.id === event.data.id || order.id === event.data.orderId) {
            return { ...order, delivery: { ...order.delivery, ...event.data } };
          }
          return order;
        })
      );
    } else if (event.type === 'new-order' && event.data.orderType === 'delivery') {
      setOrders((prev) => [event.data, ...prev]);
    }
  }, []);

  useSSE({
    onEvent: handleSSEEvent,
    eventTypes: ['order-updated', 'delivery-updated', 'new-order'],
  });

  // Polling fallback: re-fetch delivery orders every 8s to catch any missed SSE events
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDeliveryOrders();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchDeliveryOrders]);

  async function startDelivery(orderId: string) {
    setStartingDelivery(orderId);
    try {
      const res = await fetch(`/api/delivery/${orderId}/start`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, delivery: data.delivery, status: 'out-for-delivery' }
              : order
          )
        );
      }
    } catch (error) {
      console.error('Failed to start delivery:', error);
    } finally {
      setStartingDelivery(null);
    }
  }

  const activeOrders = orders.filter(
    (order) => order.status !== 'delivered' && order.delivery?.status !== 'delivered'
  );
  const readyOrders = activeOrders.filter(
    (order) => order.status === 'ready' && (!order.delivery || order.delivery.status === 'pending')
  );
  const inTransitOrders = activeOrders.filter(
    (order) => order.delivery && order.delivery.status !== 'pending'
  );
  const completedOrders = orders.filter(
    (order) => order.status === 'delivered' || order.delivery?.status === 'delivered'
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Delivery" description="Loading Stuart delivery board..." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-[1.4rem] bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Stuart Simulation"
        title="Delivery"
        description="Assign riders, monitor handoffs, and track delivery progress in real time."
        action={
          <Badge className="rounded-full bg-slate-950 px-4 py-2 text-white">
            {activeOrders.length} active routes
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Ready to Dispatch" value={readyOrders.length} icon={PackageCheck} tone="amber" />
        <AdminStatCard label="In Transit" value={inTransitOrders.length} icon={Navigation} tone="purple" />
        <AdminStatCard label="Completed" value={completedOrders.length} icon={CheckCircle2} tone="green" />
        <AdminStatCard label="Delivery Revenue" value={formatPrice(orders.reduce((sum, order) => sum + order.totalAmount, 0))} icon={Route} tone="blue" />
      </div>

      <AdminPanel
        title="Active Deliveries"
        description="Ready delivery orders can be handed to Stuart. In-flight jobs update through the simulated timeline."
      >
        {activeOrders.length === 0 ? (
          <AdminEmptyState
            icon={Truck}
            title="No active deliveries"
            description="Ready delivery orders will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {activeOrders.map((order) => (
              <div key={order.id} className="rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-bold text-slate-950">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-slate-500">{order.customerName}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1',
                      getDeliveryStatusColor(order.delivery?.status || 'pending')
                    )}
                  >
                    {(order.delivery?.status || 'pending').replace(/-/g, ' ')}
                  </span>
                </div>

                {order.deliveryAddress && (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Placed
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {getElapsedTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="flex items-center gap-1">
                      <Bike className="h-3.5 w-3.5" />
                      Rider
                    </p>
                    <p className="mt-1 truncate font-semibold text-slate-900">
                      {order.delivery?.riderName || 'Unassigned'}
                    </p>
                  </div>
                </div>

                {order.delivery && order.delivery.status !== 'pending' && (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <DeliveryTimeline status={order.delivery.status} />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold text-slate-950">
                    {formatPrice(order.totalAmount)}
                  </span>
                  {order.status === 'ready' && (!order.delivery || order.delivery.status === 'pending') && (
                    <Button
                      onClick={() => startDelivery(order.id)}
                      disabled={startingDelivery === order.id}
                      className="rounded-2xl bg-amber text-white hover:bg-amber-light"
                      size="sm"
                    >
                      <Play className="mr-2 h-3.5 w-3.5" />
                      {startingDelivery === order.id ? 'Starting...' : 'Start Delivery'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>

      {completedOrders.length > 0 && (
        <AdminPanel title="Completed Deliveries" description="Recently completed jobs are kept visible for audit and handover.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {completedOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{order.customerName}</p>
                  </div>
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                    Delivered
                  </Badge>
                </div>
                {order.delivery?.riderName && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    {order.delivery.riderName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </AdminPanel>
      )}
    </div>
  );
}
