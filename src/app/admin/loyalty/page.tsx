'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import type { LoyaltyReward } from '@/types';
import { Gift, Heart, Plus, Sparkles, Star, TicketPercent } from 'lucide-react';

export default function LoyaltyPage() {
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsRequired: '',
    discountValue: '',
  });

  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch('/api/loyalty/rewards');
      const data = await res.json();
      setRewards(data.rewards || []);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const res = await fetch('/api/loyalty/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          pointsRequired: parseInt(formData.pointsRequired, 10) || 0,
          discountValue: parseFloat(formData.discountValue) || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRewards((prev) => [...prev, data.reward]);
        setFormData({ name: '', description: '', pointsRequired: '', discountValue: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to create reward:', error);
    }
  }

  const activeRewards = rewards.filter((reward) => reward.active).length;
  const averagePoints = rewards.length
    ? Math.round(rewards.reduce((sum, reward) => sum + reward.pointsRequired, 0) / rewards.length)
    : 0;
  const highestReward = rewards.reduce((max, reward) => Math.max(max, reward.discountValue), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Loyalty" description="Loading reward programme..." />
        <div className="h-80 animate-pulse rounded-[1.4rem] bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Retention"
        title="Loyalty"
        description="Shape the rewards ladder that keeps regulars coming back."
        action={
          <Button
            onClick={() => setShowForm((value) => !value)}
            className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Reward
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Rewards" value={rewards.length} icon={Gift} tone="blue" />
        <AdminStatCard label="Active" value={activeRewards} icon={Heart} tone="green" />
        <AdminStatCard label="Avg. Points" value={averagePoints} icon={Star} tone="amber" />
        <AdminStatCard label="Top Discount" value={`£${highestReward.toFixed(2)}`} icon={TicketPercent} tone="purple" />
      </div>

      {showForm && (
        <AdminPanel title="Create Reward" description="Add a reward tier for customers to redeem in the demo programme.">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Reward Name">
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Free Dessert"
                  required
                  className="rounded-2xl"
                />
              </Field>
              <Field label="Description">
                <Input
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder="Any dessert from the menu"
                  required
                  className="rounded-2xl"
                />
              </Field>
              <Field label="Points Required">
                <Input
                  type="number"
                  min="1"
                  value={formData.pointsRequired}
                  onChange={(event) => setFormData({ ...formData, pointsRequired: event.target.value })}
                  placeholder="100"
                  required
                  className="rounded-2xl"
                />
              </Field>
              <Field label="Discount Value (£)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(event) => setFormData({ ...formData, discountValue: event.target.value })}
                  placeholder="10.00"
                  required
                  className="rounded-2xl"
                />
              </Field>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="rounded-2xl bg-amber text-white hover:bg-amber-light">
                Create Reward
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </AdminPanel>
      )}

      <AdminPanel title="Reward Ladder" description="A visual map of points, benefits, and perceived value.">
        {rewards.length === 0 ? (
          <AdminEmptyState icon={Heart} title="No loyalty rewards configured" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rewards.map((reward, index) => (
              <div
                key={reward.id}
                className="relative overflow-hidden rounded-[1.4rem] border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="absolute right-4 top-4 text-5xl font-black text-slate-50">
                  {index + 1}
                </div>
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/10 text-amber">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="mt-5">
                    <h3 className="font-heading text-xl font-bold text-slate-950">
                      {reward.name}
                    </h3>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                      {reward.description}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <Star className="h-3.5 w-3.5 text-amber" />
                      {reward.pointsRequired} pts
                    </span>
                    <span className="font-bold text-slate-950">
                      £{reward.discountValue.toFixed(2)}
                    </span>
                  </div>
                  <Badge className={reward.active ? 'mt-4 rounded-full bg-emerald-50 text-emerald-700' : 'mt-4 rounded-full bg-slate-100 text-slate-500'}>
                    {reward.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
