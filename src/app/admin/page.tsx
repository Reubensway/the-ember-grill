'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatPrice, getElapsedTime } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import type { Order, Reservation, Customer, DeliveryStatus } from '@/types';
import {
  ClipboardList,
  DollarSign,
  Truck,
  CalendarDays,
  X,
  ChefHat,
  Users,
  PackageOpen,
  ArrowRight,
  User,
  AlertTriangle,
} from 'lucide-react';

type TimeRange = 'today' | 'week' | 'month' | 'custom';

interface DashboardMetrics {
  filteredOrders: number;
  filteredRevenue: number;
  activeDeliveries: number;
  upcomingReservations: number;
}

interface CustomRange {
  from: string;
  to: string;
}

interface InventoryItem {
  id: string;
  menuItemId: string;
  menuItem: { name: string; category: string; price: number };
  currentStock: number;
  unit: string;
  lowThreshold: number;
  isLowStock: boolean;
}

function getDateFrom(range: TimeRange, customRange: CustomRange | null): Date | null {
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'custom':
      return customRange?.from ? new Date(customRange.from) : null;
  }
}

function getDateTo(range: TimeRange, customRange: CustomRange | null): Date | null {
  if (range === 'custom' && customRange?.to) {
    const d = new Date(customRange.to);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return null;
}

const timeRangeLabels: { key: TimeRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

function SectionHeader({ title, href, linkText }: { title: string; href: string; linkText: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-heading text-lg font-semibold text-gray-900">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm font-medium text-amber hover:text-amber-light transition-colors"
      >
        {linkText}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function getDeliveryStatusLabel(status: DeliveryStatus): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminOverviewPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    filteredOrders: 0,
    filteredRevenue: 0,
    activeDeliveries: 0,
    upcomingReservations: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const dateFrom = getDateFrom(timeRange, customRange);
        const dateTo = getDateTo(timeRange, customRange);

        // Fetch orders filtered by date range
        const params = new URLSearchParams();
        if (dateFrom) params.set('from', dateFrom.toISOString());
        if (dateTo) params.set('to', dateTo.toISOString());
        const ordersUrl = `/api/orders?${params.toString()}`;

        const [ordersRes, allOrdersRes, resRes, custRes, invRes] = await Promise.all([
          fetch(ordersUrl),
          fetch('/api/orders'),
          fetch('/api/reservations').catch(() => null),
          fetch('/api/customers').catch(() => null),
          fetch('/api/inventory').catch(() => null),
        ]);

        const ordersData = await ordersRes.json();
        const filteredOrders: Order[] = ordersData.orders || [];

        const allOrdersData = await allOrdersRes.json();
        const allOrdersList: Order[] = allOrdersData.orders || [];

        // Calculate metrics
        const revenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const activeDeliveries = allOrdersList.filter(
          (o) =>
            o.orderType === 'delivery' &&
            ['ready', 'out-for-delivery'].includes(o.status)
        ).length;

        // Reservations
        let upcomingReservations = 0;
        let reservationsList: Reservation[] = [];
        if (resRes) {
          try {
            const resData = await resRes.json();
            reservationsList = (resData.reservations || []).filter(
              (r: Reservation) => r.status === 'confirmed'
            );
            upcomingReservations = reservationsList.length;
          } catch { /* ignore */ }
        }

        // Customers
        let customersList: Customer[] = [];
        if (custRes) {
          try {
            const custData = await custRes.json();
            customersList = (custData.customers || [])
              .sort((a: Customer, b: Customer) => b.totalSpend - a.totalSpend);
          } catch { /* ignore */ }
        }

        // Inventory
        if (invRes) {
          try {
            const invData = await invRes.json();
            const allInvItems = invData.items || [];
            setItems(allInvItems);
          } catch { /* ignore */ }
        }

        setMetrics({
          filteredOrders: filteredOrders.length,
          filteredRevenue: revenue,
          activeDeliveries,
          upcomingReservations,
        });

        setRecentOrders(filteredOrders.slice(0, 4));
        setAllOrders(allOrdersList);
        setReservations(reservationsList);
        setCustomers(customersList);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange, customRange]);

  // Derived data for sections
  const kitchenOrders = allOrders.filter((o) =>
    ['received', 'preparing', 'ready'].includes(o.status)
  );
  const kitchenStatusCounts = {
    received: kitchenOrders.filter((o) => o.status === 'received').length,
    preparing: kitchenOrders.filter((o) => o.status === 'preparing').length,
    ready: kitchenOrders.filter((o) => o.status === 'ready').length,
  };

  const activeDeliveryOrders = allOrders.filter(
    (o) =>
      o.orderType === 'delivery' &&
      o.delivery &&
      o.delivery.status !== 'delivered' &&
      o.delivery.status !== 'pending'
  ).slice(0, 3);

  const orderLabel =
    timeRange === 'today'
      ? "Today's Orders"
      : timeRange === 'week'
        ? "This Week's Orders"
        : timeRange === 'month'
          ? "This Month's Orders"
          : 'Custom Range Orders';

  const revenueLabel =
    timeRange === 'today'
      ? "Today's Revenue"
      : timeRange === 'week'
        ? "This Week's Revenue"
        : timeRange === 'month'
          ? "This Month's Revenue"
          : 'Custom Range Revenue';

  function handleCustomApply() {
    if (customFrom) {
      setCustomRange({ from: customFrom, to: customTo || customFrom });
      setTimeRange('custom');
      setShowCustomPicker(false);
    }
  }

  function handleTimeRangeClick(key: TimeRange) {
    if (key === 'custom') {
      setShowCustomPicker(true);
    } else {
      setTimeRange(key);
      setShowCustomPicker(false);
      setCustomRange(null);
    }
  }

  const metricCards = [
    {
      label: orderLabel,
      value: metrics.filteredOrders.toString(),
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: revenueLabel,
      value: formatPrice(metrics.filteredRevenue),
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Active Deliveries',
      value: metrics.activeDeliveries.toString(),
      icon: Truck,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Upcoming Reservations',
      value: metrics.upcomingReservations.toString(),
      icon: CalendarDays,
      color: 'text-amber bg-amber/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        {/* Time range filter buttons */}
        <div className="relative z-50 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-1.5">
          {timeRangeLabels.map(({ key, label }) => (
            <Button
              key={key}
              variant={timeRange === key ? 'default' : 'ghost'}
              size="sm"
              className={
                timeRange === key
                  ? 'rounded-xl bg-amber text-white shadow-none hover:bg-amber-light'
                  : 'rounded-xl text-gray-500 hover:text-gray-900'
              }
              onClick={() => handleTimeRangeClick(key)}
            >
              {key === 'custom' && customRange ? (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {customRange.from.split('-').reverse().slice(0, 2).join('/')}
                </span>
              ) : (
                label
              )}
            </Button>
          ))}

          {/* Custom date picker popup */}
          {showCustomPicker && (
            <div className="fixed inset-0 z-[100]" onClick={() => setShowCustomPicker(false)}>
              <div
                className="absolute right-8 top-32 w-80 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-sm font-semibold text-gray-900">Custom Date Range</h3>
                  <button
                    onClick={() => setShowCustomPicker(false)}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">From</Label>
                    <Input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">To</Label>
                    <Input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleCustomApply}
                    disabled={!customFrom}
                    className="w-full rounded-xl bg-amber text-white hover:bg-amber-light"
                    size="sm"
                  >
                    Apply Range
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-7">
              <div className="h-4 w-24 rounded bg-gray-100" />
              <div className="mt-3 h-8 w-16 rounded bg-gray-100" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-7">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl p-3 ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Row 2: Inventory Status (1/3) + Recent Orders (2/3) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Inventory Status — compact */}
        <Card className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-7">
          <SectionHeader title="Inventory" href="/admin/inventory" linkText="Manage" />
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 rounded bg-gray-50" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Out of Stock items */}
              {items.filter((i) => i.currentStock === 0).length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-semibold text-red-700">
                      {items.filter((i) => i.currentStock === 0).length} Out of Stock
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {items.filter((i) => i.currentStock === 0).slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-gray-800 truncate">{item.menuItem.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                  <PackageOpen className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">All items in stock</span>
                </div>
              )}

              {/* In Stock count */}
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-green-700 font-medium">
                  {items.filter((i) => i.currentStock > 0).length} In Stock
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2 rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-7">
          <SectionHeader title="Recent Orders" href="/admin/orders" linkText="View All Orders" />
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-gray-50" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-left text-gray-400">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 text-gray-600">
                        {order.customerName}
                      </td>
                      <td className="py-3 text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-gray-400">
                        {getElapsedTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: Kitchen Status (1/3) + Active Deliveries (1/3) + Upcoming Reservations (1/3) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Kitchen Status */}
        <Card className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-7">
          <SectionHeader title="Kitchen Status" href="/admin/kitchen" linkText="View Kitchen" />
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-xl bg-gray-50" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 px-3 py-1.5">
                  <ChefHat className="mr-1.5 h-3.5 w-3.5" />
                  {kitchenStatusCounts.received} Received
                </Badge>
                <Badge className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1.5">
                  <ChefHat className="mr-1.5 h-3.5 w-3.5" />
                  {kitchenStatusCounts.preparing} Preparing
                </Badge>
                <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5">
                  <ChefHat className="mr-1.5 h-3.5 w-3.5" />
                  {kitchenStatusCounts.ready} Ready
                </Badge>
              </div>
              <div className="space-y-2">
                {kitchenOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50/80 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                ))}
                {kitchenOrders.length === 0 && (
                  <p className="text-sm text-gray-400">No active kitchen orders.</p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Active Deliveries */}
        <Card className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-7">
          <SectionHeader title="Active Deliveries" href="/admin/delivery" linkText="View All" />
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-50" />
              ))}
            </div>
          ) : activeDeliveryOrders.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <Truck className="h-8 w-8 text-gray-200" />
              <p className="mt-2 text-sm text-gray-400">No active deliveries</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDeliveryOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl bg-gray-50/80 px-3 py-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <Badge className="bg-purple-50 text-purple-700 text-xs">
                      {getDeliveryStatusLabel(order.delivery!.status)}
                    </Badge>
                  </div>
                  {order.delivery?.riderName && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      {order.delivery.riderName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Reservations */}
        <Card className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-7">
          <SectionHeader title="Upcoming Reservations" href="/admin/reservations" linkText="View All" />
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-gray-50" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CalendarDays className="h-8 w-8 text-gray-200" />
              <p className="mt-2 text-sm text-gray-400">No upcoming reservations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  className="rounded-xl bg-gray-50/80 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{res.customerName}</p>
                    <Badge className="bg-amber/10 text-amber text-xs">
                      {res.partySize} guests
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(res.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at {res.time}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 4: Top Customers (full width, compact) */}
      <Card className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-7">
        <SectionHeader title="Top Customers" href="/admin/customers" linkText="View All" />
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-50" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center py-4 text-center">
            <Users className="h-8 w-8 text-gray-200" />
            <p className="mt-2 text-sm text-gray-400">No customer data yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {customers.slice(0, 3).map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-3 py-2.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber/10 text-xs font-bold text-amber">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.totalOrders} orders</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatPrice(customer.totalSpend)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}
