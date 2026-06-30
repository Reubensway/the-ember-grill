'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import { formatPrice } from '@/lib/utils';
import { Download, Mail, Search, Sparkles, Star, Users, WalletCards } from 'lucide-react';

interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpend: number;
  loyaltyPoints: number;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = useCallback(async (search: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchCustomers, searchQuery]);

  function exportCSV() {
    const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spend', 'Loyalty Points'];
    const rows = customers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone || '',
      customer.totalOrders.toString(),
      customer.totalSpend.toFixed(2),
      customer.loyaltyPoints.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);
  const totalPoints = customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0);
  const topCustomer = useMemo(
    () => [...customers].sort((a, b) => b.totalSpend - a.totalSpend)[0],
    [customers]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="CRM" description="Loading customer records..." />
        <div className="h-96 animate-pulse rounded-[1.4rem] bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Customer Relationships"
        title="CRM"
        description="Search guests, understand loyalty, and export first-party customer data."
        action={
          <Button onClick={exportCSV} className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Customers" value={customers.length} icon={Users} tone="blue" />
        <AdminStatCard label="Total Orders" value={totalOrders} icon={WalletCards} tone="green" />
        <AdminStatCard label="Total Spend" value={formatPrice(totalSpend)} icon={Sparkles} tone="amber" />
        <AdminStatCard label="Loyalty Points" value={totalPoints} icon={Star} tone="purple" helper={topCustomer ? `Top: ${topCustomer.name}` : undefined} />
      </div>

      <AdminPanel>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="rounded-2xl border-slate-200 bg-white pl-10"
          />
        </div>
      </AdminPanel>

      <AdminPanel title="Customer Directory" description="A compact ledger of guests, spend, and loyalty balance.">
        {customers.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="No customers found"
            description="Completed orders with customer emails create CRM profiles."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <div className="hidden grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.7fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 lg:grid">
              <span>Guest</span>
              <span>Contact</span>
              <span>Orders</span>
              <span>Spend</span>
              <span>Points</span>
            </div>
            <div className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="grid gap-4 px-5 py-4 transition hover:bg-slate-50/70 lg:grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.7fr] lg:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                      {customer.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-semibold text-slate-950 hover:text-amber"
                      >
                        {customer.name}
                      </Link>
                      <p className="text-xs text-slate-400">Customer since {new Date(customer.createdAt).getFullYear()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {customer.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{customer.phone || 'No phone saved'}</p>
                  </div>
                  <p className="font-semibold text-slate-950">{customer.totalOrders}</p>
                  <p className="font-semibold text-slate-950">{formatPrice(customer.totalSpend)}</p>
                  <Badge className="w-fit rounded-full bg-amber/10 text-amber">
                    <Star className="mr-1 h-3.5 w-3.5" />
                    {customer.loyaltyPoints}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
