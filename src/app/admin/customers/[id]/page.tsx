'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Customer, Order } from '@/types';
import {
  ArrowLeft,
  Clock,
  CreditCard,
  Mail,
  Phone,
  ShoppingBag,
  Star,
  User,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Customer Profile" description="Loading guest record..." />
        <div className="h-96 animate-pulse rounded-[1.4rem] bg-white/70" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button render={<Link href="/admin/customers" />} variant="ghost" className="rounded-2xl">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CRM
        </Button>
        <AdminEmptyState icon={User} title="Customer not found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button render={<Link href="/admin/customers" />} variant="ghost" className="rounded-2xl">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to CRM
      </Button>

      <AdminPageHeader
        eyebrow="Customer Profile"
        title={customer.name}
        description="Guest history, contact details, and loyalty value."
        action={
          <Badge className="rounded-full bg-amber/10 px-4 py-2 text-amber">
            <Star className="mr-2 h-4 w-4" />
            {customer.loyaltyPoints} points
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Total Orders" value={customer.totalOrders} icon={ShoppingBag} tone="blue" />
        <AdminStatCard label="Total Spend" value={formatPrice(customer.totalSpend)} icon={CreditCard} tone="green" />
        <AdminStatCard label="Loyalty Points" value={customer.loyaltyPoints} icon={Star} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminPanel title="Contact Card">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber text-xl font-black">
              {customer.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold">{customer.name}</h2>
            <p className="mt-1 text-sm text-white/45">Joined {formatDate(customer.createdAt)}</p>
          </div>
          <div className="mt-4 space-y-3">
            <ContactRow icon={Mail} label="Email" value={customer.email} />
            {customer.phone && <ContactRow icon={Phone} label="Phone" value={customer.phone} />}
          </div>
        </AdminPanel>

        <AdminPanel title="Order History" description="Most recent orders and item details.">
          {customer.orders.length === 0 ? (
            <AdminEmptyState icon={ShoppingBag} title="No orders yet" />
          ) : (
            <div className="space-y-3">
              {customer.orders.map((order: Order) => (
                <div key={order.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-heading text-lg font-bold text-slate-950">
                        {order.orderNumber}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="capitalize">{order.orderType}</span>
                        <span>{order.items.length} items</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-slate-950">{formatPrice(order.totalAmount)}</p>
                      <Badge className="mt-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                        {order.status}
                      </Badge>
                    </div>
                  </div>

                  {order.items.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {item.quantity}x {item.menuItem.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="rounded-xl bg-white p-2 text-slate-400 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}
