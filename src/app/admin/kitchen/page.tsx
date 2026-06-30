'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import { useSSE } from '@/hooks/use-sse';
import { cn, getElapsedTime } from '@/lib/utils';
import type { Order, SSEEvent } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  PackageCheck,
  ShoppingBag,
  Timer,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      const kitchenOrders = (data.orders || []).filter((order: Order) =>
        ['received', 'preparing', 'ready'].includes(order.status)
      );
      setOrders(kitchenOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'new-order') {
      const newOrder = event.data as Order;
      if (['received', 'preparing', 'ready'].includes(newOrder.status)) {
        setOrders((prev) => [...prev, newOrder]);
      }
    } else if (event.type === 'order-updated') {
      const updatedOrder = event.data as Order;
      if (['received', 'preparing', 'ready'].includes(updatedOrder.status)) {
        setOrders((prev) => {
          const exists = prev.some((order) => order.id === updatedOrder.id);
          return exists
            ? prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
            : [...prev, updatedOrder];
        });
      } else {
        setOrders((prev) => prev.filter((order) => order.id !== updatedOrder.id));
      }
    }
  }, []);

  useSSE({
    onEvent: handleSSEEvent,
    eventTypes: ['new-order', 'order-updated'],
  });

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.order as Order;
        if (['received', 'preparing', 'ready'].includes(updatedOrder.status)) {
          setOrders((prev) =>
            prev.map((order) => (order.id === orderId ? updatedOrder : order))
          );
        } else {
          setOrders((prev) => prev.filter((order) => order.id !== orderId));
        }
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  }

  const receivedOrders = orders
    .filter((order) => order.status === 'received')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const preparingOrders = orders
    .filter((order) => order.status === 'preparing')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const readyOrders = orders
    .filter((order) => order.status === 'ready')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const deliveryOrders = orders.filter((order) => order.orderType === 'delivery').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Kitchen Display" description="Loading active tickets..." />
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-[1.4rem] bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Back of House"
        title="Kitchen Display"
        description="A fast-moving ticket board for chefs, runners, and service leads."
        action={
          <Badge className="rounded-full bg-slate-950 px-4 py-2 text-white">
            {orders.length} live tickets
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="New" value={receivedOrders.length} icon={Clock} tone="blue" />
        <AdminStatCard label="Preparing" value={preparingOrders.length} icon={Flame} tone="amber" />
        <AdminStatCard label="Ready" value={readyOrders.length} icon={PackageCheck} tone="green" />
        <AdminStatCard label="Delivery Tickets" value={deliveryOrders} icon={Truck} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <KitchenColumn
          title="New Orders"
          description="Newest first, ready to start"
          icon={<Clock className="h-5 w-5" />}
          accent="from-blue-500 to-indigo-500"
          orders={receivedOrders}
          actionLabel="Start Preparing"
          actionStatus="preparing"
          onAction={updateOrderStatus}
          updatingStatus={updatingStatus}
        />
        <KitchenColumn
          title="On Fire"
          description="Currently being prepared"
          icon={<ChefHat className="h-5 w-5" />}
          accent="from-amber to-orange-500"
          orders={preparingOrders}
          actionLabel="Mark Ready"
          actionStatus="ready"
          onAction={updateOrderStatus}
          updatingStatus={updatingStatus}
        />
        <KitchenColumn
          title="Ready Pass"
          description="Waiting for service or courier"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="from-emerald-500 to-teal-500"
          orders={readyOrders}
          actionLabel={null}
          actionStatus={null}
          onAction={updateOrderStatus}
          updatingStatus={updatingStatus}
        />
      </div>
    </div>
  );
}

interface KitchenColumnProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  orders: Order[];
  actionLabel: string | null;
  actionStatus: string | null;
  onAction: (orderId: string, status: string) => void;
  updatingStatus: string | null;
}

function KitchenColumn({
  title,
  description,
  icon,
  accent,
  orders,
  actionLabel,
  actionStatus,
  onAction,
  updatingStatus,
}: KitchenColumnProps) {
  return (
    <AdminPanel className="min-h-[620px] p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className={cn('mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r', accent)} />
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-600">{icon}</div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-slate-950">{title}</h2>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="rounded-full">
          {orders.length}
        </Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <KitchenTicket
                order={order}
                actionLabel={actionLabel}
                actionStatus={actionStatus}
                onAction={onAction}
                updatingStatus={updatingStatus}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {orders.length === 0 && (
          <AdminEmptyState
            icon={ChefHat}
            title="No tickets"
            description="This lane is clear for the moment."
          />
        )}
      </div>
    </AdminPanel>
  );
}

interface KitchenTicketProps {
  order: Order;
  actionLabel: string | null;
  actionStatus: string | null;
  onAction: (orderId: string, status: string) => void;
  updatingStatus: string | null;
}

function KitchenTicket({
  order,
  actionLabel,
  actionStatus,
  onAction,
  updatingStatus,
}: KitchenTicketProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-100 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-black tracking-tight text-slate-950">
              {order.orderNumber}
            </p>
            <OrderTypeBadge orderType={order.orderType} />
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Timer className="h-3.5 w-3.5" />
            {getElapsedTime(order.createdAt)}
          </p>
        </div>
        <Badge className="rounded-full bg-slate-950 text-white">
          {itemCount} items
        </Badge>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 text-sm">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-xl bg-slate-100 px-2 text-xs font-black text-slate-700">
                {item.quantity}x
              </span>
              <span className="pt-1 font-semibold text-slate-900">
                {item.menuItem.name}
              </span>
            </li>
          ))}
        </ul>

        {order.specialInstructions && (
          <div className="mt-4 flex gap-2 rounded-2xl border border-amber/20 bg-amber/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p className="text-xs font-medium leading-5 text-slate-700">
              {order.specialInstructions}
            </p>
          </div>
        )}
      </div>

      {actionLabel && actionStatus && (
        <div className="border-t border-slate-100 p-3">
          <Button
            onClick={() => onAction(order.id, actionStatus)}
            disabled={updatingStatus === order.id}
            className={cn(
              'w-full rounded-2xl font-semibold',
              actionStatus === 'preparing'
                ? 'bg-amber text-white hover:bg-amber-light'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            )}
          >
            {updatingStatus === order.id ? 'Updating...' : actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function OrderTypeBadge({ orderType }: { orderType: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    'dine-in': {
      icon: <UtensilsCrossed className="h-3 w-3" />,
      label: 'Dine-in',
      className: 'bg-blue-50 text-blue-700 ring-blue-100',
    },
    pickup: {
      icon: <ShoppingBag className="h-3 w-3" />,
      label: 'Pickup',
      className: 'bg-orange-50 text-orange-700 ring-orange-100',
    },
    delivery: {
      icon: <Truck className="h-3 w-3" />,
      label: 'Delivery',
      className: 'bg-violet-50 text-violet-700 ring-violet-100',
    },
  };

  const current = config[orderType] || config['dine-in'];

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', current.className)}>
      {current.icon}
      {current.label}
    </span>
  );
}
