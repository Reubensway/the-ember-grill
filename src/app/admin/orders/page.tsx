'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { useSSE } from '@/hooks/use-sse';
import { cn, formatPrice, getElapsedTime } from '@/lib/utils';
import { ORDER_STATUS_TRANSITIONS } from '@/lib/constants';
import type { Order, OrderStatus, SSEEvent } from '@/types';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  UtensilsCrossed,
  X,
} from 'lucide-react';

const STATUS_COLUMNS: {
  key: OrderStatus | 'completed';
  label: string;
  hint: string;
  statuses: OrderStatus[];
  accent: string;
}[] = [
  {
    key: 'received',
    label: 'Received',
    hint: 'Needs acknowledgement',
    statuses: ['received'],
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    hint: 'Kitchen in progress',
    statuses: ['preparing'],
    accent: 'from-amber to-orange-500',
  },
  {
    key: 'ready',
    label: 'Ready',
    hint: 'Awaiting handoff',
    statuses: ['ready'],
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'completed',
    label: 'Completed',
    hint: 'Closed and fulfilled',
    statuses: ['served', 'collected', 'delivered', 'out-for-delivery'],
    accent: 'from-slate-500 to-slate-700',
  },
];

function OrderTypeIcon({ type }: { type: string }) {
  if (type === 'delivery') return <Truck className="h-3.5 w-3.5" />;
  if (type === 'dine-in') return <UtensilsCrossed className="h-3.5 w-3.5" />;
  return <ShoppingBag className="h-3.5 w-3.5" />;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', new Date(dateFrom).toISOString());
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        params.set('to', to.toISOString());
      }
      if (orderTypeFilter !== 'all') params.set('orderType', orderTypeFilter);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, orderTypeFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'new-order') {
      setOrders((prev) => [event.data, ...prev]);
    } else if (event.type === 'order-updated') {
      setOrders((prev) =>
        prev.map((order) => (order.id === event.data.id ? event.data : order))
      );
      setSelectedOrder((prev) =>
        prev && prev.id === event.data.id ? event.data : prev
      );
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
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? data.order : order))
        );
        setSelectedOrder((prev) =>
          prev?.id === orderId ? data.order : prev
        );
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) =>
      [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.customerPhone,
        order.deliveryAddress,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [orders, searchQuery]);

  const receivedCount = filteredOrders.filter((o) => o.status === 'received').length;
  const activeCount = filteredOrders.filter((o) =>
    ['received', 'preparing', 'ready', 'out-for-delivery'].includes(o.status)
  ).length;
  const revenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const deliveryCount = filteredOrders.filter((o) => o.orderType === 'delivery').length;

  function getNextStatuses(status: OrderStatus): string[] {
    return ORDER_STATUS_TRANSITIONS[status] || [];
  }

  function getOrdersByStatuses(statuses: OrderStatus[]) {
    return filteredOrders.filter((order) => statuses.includes(order.status));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Orders" description="Loading the order board..." />
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-[1.4rem] bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Live Service"
        title="Orders"
        description="A command board for every dine-in, pickup, and delivery order moving through service."
        action={
          <Badge className="rounded-full bg-slate-950 px-4 py-2 text-white">
            {activeCount} active
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Visible Orders" value={filteredOrders.length} icon={ReceiptText} tone="blue" />
        <AdminStatCard label="New Queue" value={receivedCount} icon={Sparkles} tone="amber" />
        <AdminStatCard label="Delivery Orders" value={deliveryCount} icon={Truck} tone="purple" />
        <AdminStatCard label="Board Revenue" value={formatPrice(revenue)} icon={CheckCircle2} tone="green" />
      </div>

      <AdminPanel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search order number, guest, phone, email, or address"
              className="rounded-2xl border-slate-200 bg-white pl-10"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:w-auto">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                From
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="rounded-2xl border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                To
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="rounded-2xl border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Type
              </label>
              <select
                value={orderTypeFilter}
                onChange={(event) => setOrderTypeFilter(event.target.value)}
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber/20"
              >
                <option value="all">All Types</option>
                <option value="dine-in">Dine-in</option>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          </div>
          {(dateFrom || dateTo || orderTypeFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              className="rounded-2xl text-slate-500"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setOrderTypeFilter('all');
                setSearchQuery('');
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </AdminPanel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {STATUS_COLUMNS.map((column) => {
          const columnOrders = getOrdersByStatuses(column.statuses);
          return (
            <AdminPanel key={column.key} className="p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className={cn('mb-3 h-1.5 w-14 rounded-full bg-gradient-to-r', column.accent)} />
                  <h2 className="font-heading text-lg font-semibold text-slate-950">
                    {column.label}
                  </h2>
                  <p className="text-xs text-slate-400">{column.hint}</p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {columnOrders.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {columnOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={cn(
                      'w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                      selectedOrder?.id === order.id
                        ? 'border-amber ring-2 ring-amber/15'
                        : 'border-slate-100'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{order.customerName}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 capitalize">
                        <OrderTypeIcon type={order.orderType} />
                        {order.orderType}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {order.items.length} items
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {getElapsedTime(order.createdAt)}
                      </span>
                      <span className="font-semibold text-slate-950">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </button>
                ))}
                {columnOrders.length === 0 && (
                  <AdminEmptyState
                    icon={ReceiptText}
                    title="No orders here"
                    description="This lane will update as orders move through service."
                  />
                )}
              </div>
            </AdminPanel>
          );
        })}
      </div>

      {selectedOrder && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-white/70 bg-white shadow-2xl shadow-slate-950/20">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                  Order Details
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-slate-950">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() => setSelectedOrder(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <AdminPanel className="bg-slate-50/70 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <div className="mt-1"><OrderStatusBadge status={selectedOrder.status} /></div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="mt-1 font-semibold capitalize text-slate-900">{selectedOrder.orderType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Guest</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Placed</p>
                  <p className="mt-1 font-semibold text-slate-900">{getElapsedTime(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.tableNumber && (
                  <div>
                    <p className="text-xs text-slate-400">Table</p>
                    <p className="mt-1 font-semibold text-slate-900">#{selectedOrder.tableNumber}</p>
                  </div>
                )}
                {selectedOrder.deliveryAddress && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400">Delivery Address</p>
                    <p className="mt-1 font-semibold text-slate-900">{selectedOrder.deliveryAddress}</p>
                  </div>
                )}
              </div>
            </AdminPanel>

            <AdminPanel title="Items">
              <ul className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.quantity}x {item.menuItem.name}
                      </p>
                      <p className="text-xs text-slate-400">{formatPrice(item.unitPrice)} each</p>
                    </div>
                    <p className="font-semibold text-slate-950">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              {selectedOrder.specialInstructions && (
                <div className="mt-4 rounded-2xl border border-amber/20 bg-amber/10 p-4 text-sm text-slate-700">
                  {selectedOrder.specialInstructions}
                </div>
              )}
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">Total</span>
                <span className="text-2xl font-bold text-slate-950">
                  {formatPrice(selectedOrder.totalAmount)}
                </span>
              </div>
            </AdminPanel>

            {getNextStatuses(selectedOrder.status).length > 0 && (
              <AdminPanel title="Next Action" description="Move this order through the service workflow.">
                <div className="space-y-2">
                  {getNextStatuses(selectedOrder.status).map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      onClick={() => updateOrderStatus(selectedOrder.id, nextStatus)}
                      disabled={updatingStatus === selectedOrder.id}
                      className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                    >
                      <ChevronRight className="mr-2 h-4 w-4" />
                      Mark as {nextStatus.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </AdminPanel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
