'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminPageHeader, AdminPanel, AdminStatCard } from '@/components/admin/AdminPage';
import {
  Calendar,
  Eye,
  Mail,
  Megaphone,
  MessageSquare,
  Plus,
  Send,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react';

const campaigns = [
  { id: '1', name: 'Summer Special', type: 'email', status: 'completed', sentDate: '2024-07-15', recipients: 1250, openRate: 34.2 },
  { id: '2', name: 'New Menu Launch', type: 'email', status: 'completed', sentDate: '2024-08-01', recipients: 1480, openRate: 41.8 },
  { id: '3', name: 'Weekend Brunch Promo', type: 'sms', status: 'completed', sentDate: '2024-08-10', recipients: 890, openRate: 72.5 },
  { id: '4', name: 'Loyalty Double Points', type: 'email', status: 'draft', sentDate: null, recipients: 0, openRate: 0 },
];

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  usageCount: number;
  usageLimit: number;
  active: boolean;
  expiryDate: string;
}

type Tab = 'campaigns' | 'discounts' | 'email' | 'sms';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns');
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailForm, setEmailForm] = useState({ segment: 'all', subject: '', message: '' });
  const [smsForm, setSmsForm] = useState({ segment: 'all', message: '' });
  const [discountForm, setDiscountForm] = useState({ code: '', type: 'percentage', value: '', usageLimit: '' });
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);

  const fetchDiscountCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/discount-codes');
      if (res.ok) {
        const data = await res.json();
        setDiscountCodes(data.codes || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchDiscountCodes();
  }, [fetchDiscountCodes]);

  async function handleCreateDiscount() {
    if (!discountForm.code || !discountForm.value || !discountForm.usageLimit) return;
    try {
      const res = await fetch('/api/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountForm.code,
          type: discountForm.type,
          value: parseFloat(discountForm.value),
          usageLimit: parseInt(discountForm.usageLimit, 10),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiscountCodes((prev) => [data.code, ...prev]);
        setDiscountForm({ code: '', type: 'percentage', value: '', usageLimit: '' });
        setShowDiscountForm(false);
      }
    } catch { /* ignore */ }
  }

  const totalRecipients = campaigns.reduce((sum, campaign) => sum + campaign.recipients, 0);
  const completedCampaigns = campaigns.filter((campaign) => campaign.status === 'completed');
  const averageOpenRate = completedCampaigns.length
    ? completedCampaigns.reduce((sum, campaign) => sum + campaign.openRate, 0) / completedCampaigns.length
    : 0;
  const activeDiscounts = discountCodes.filter((code) => code.active).length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'campaigns', label: 'Campaigns', icon: <Megaphone className="h-4 w-4" /> },
    { key: 'discounts', label: 'Discounts', icon: <Tag className="h-4 w-4" /> },
    { key: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
    { key: 'sms', label: 'SMS', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Engagement"
        title="Marketing"
        description="A demo-ready campaign cockpit for promotions, discount codes, email, and SMS."
        action={
          <Badge className="rounded-full bg-slate-950 px-4 py-2 text-white">
            Static demo workspace
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Campaigns" value={campaigns.length} icon={Send} tone="blue" />
        <AdminStatCard label="Recipients" value={totalRecipients.toLocaleString()} icon={Users} tone="green" />
        <AdminStatCard label="Avg. Open Rate" value={`${averageOpenRate.toFixed(1)}%`} icon={TrendingUp} tone="amber" />
        <AdminStatCard label="Active Codes" value={activeDiscounts} icon={Tag} tone="purple" />
      </div>

      <AdminPanel>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-slate-950 text-white'
                  : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-950'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </AdminPanel>

      {activeTab === 'campaigns' && (
        <AdminPanel title="Campaign History" description="Recent broadcasts, channel mix, and response rates.">
          <div className="grid gap-4 lg:grid-cols-2">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-[1.25rem] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {campaign.type === 'email' ? (
                        <Mail className="h-4 w-4 text-blue-600" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                      )}
                      <h3 className="font-heading text-lg font-bold text-slate-950">{campaign.name}</h3>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {campaign.sentDate || 'Draft campaign'}
                    </p>
                  </div>
                  <Badge className={campaign.status === 'completed' ? 'rounded-full bg-emerald-50 text-emerald-700' : 'rounded-full bg-slate-100 text-slate-500'}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Metric label="Recipients" value={campaign.recipients.toLocaleString()} />
                  <Metric label="Open Rate" value={`${campaign.openRate}%`} />
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      )}

      {activeTab === 'discounts' && (
        <AdminPanel
          title="Discount Codes"
          description="Static demo management for promo codes and usage caps."
          actionLabel={showDiscountForm ? 'Hide Form' : 'New Code'}
        >
          <div className="mb-5">
            <Button
              onClick={() => setShowDiscountForm((value) => !value)}
              className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              {showDiscountForm ? 'Hide Form' : 'Create Code'}
            </Button>
          </div>
          {showDiscountForm && (
            <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Input placeholder="CODE" value={discountForm.code} onChange={(event) => setDiscountForm({ ...discountForm, code: event.target.value.toUpperCase() })} className="rounded-2xl bg-white" />
                <select value={discountForm.type} onChange={(event) => setDiscountForm({ ...discountForm, type: event.target.value })} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <Input placeholder="Value" type="number" value={discountForm.value} onChange={(event) => setDiscountForm({ ...discountForm, value: event.target.value })} className="rounded-2xl bg-white" />
                <Input placeholder="Usage limit" type="number" value={discountForm.usageLimit} onChange={(event) => setDiscountForm({ ...discountForm, usageLimit: event.target.value })} className="rounded-2xl bg-white" />
              </div>
              <Button onClick={handleCreateDiscount} className="mt-3 rounded-2xl bg-amber text-white hover:bg-amber-light">
                Save Code
              </Button>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-3">
            {discountCodes.map((code) => (
              <div key={code.id} className="rounded-[1.25rem] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xl font-black tracking-tight text-slate-950">{code.code}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {code.type === 'percentage' ? `${code.value}% off` : `£${code.value} off`}
                    </p>
                  </div>
                  <Badge className={code.active ? 'rounded-full bg-emerald-50 text-emerald-700' : 'rounded-full bg-slate-100 text-slate-500'}>
                    {code.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber"
                      style={{ width: `${Math.min((code.usageCount / code.usageLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {code.usageCount} / {code.usageLimit} redemptions
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      )}

      {activeTab === 'email' && (
        <ComposerPanel
          title="Email Composer"
          description="Prepare a campaign preview for selected customer segments."
          channelIcon={<Mail className="h-5 w-5" />}
        >
          <CampaignFields
            segment={emailForm.segment}
            onSegmentChange={(segment) => setEmailForm({ ...emailForm, segment })}
          />
          <Input
            placeholder="Subject line"
            value={emailForm.subject}
            onChange={(event) => setEmailForm({ ...emailForm, subject: event.target.value })}
            className="rounded-2xl"
          />
          <Textarea
            placeholder="Write your message..."
            value={emailForm.message}
            onChange={(event) => setEmailForm({ ...emailForm, message: event.target.value })}
            rows={7}
            className="rounded-2xl"
          />
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-2xl bg-amber text-white hover:bg-amber-light">
              <Send className="mr-2 h-4 w-4" />
              Send Campaign
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => setShowEmailPreview((value) => !value)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>
          {showEmailPreview && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preview</p>
              <h3 className="mt-3 font-heading text-xl font-bold text-slate-950">
                {emailForm.subject || 'Your subject line'}
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {emailForm.message || 'Your email message will appear here.'}
              </p>
            </div>
          )}
        </ComposerPanel>
      )}

      {activeTab === 'sms' && (
        <ComposerPanel
          title="SMS Composer"
          description="Short, high-intent texts for repeat guests and loyalty members."
          channelIcon={<MessageSquare className="h-5 w-5" />}
        >
          <CampaignFields
            segment={smsForm.segment}
            onSegmentChange={(segment) => setSmsForm({ ...smsForm, segment })}
          />
          <Textarea
            placeholder="Write an SMS message..."
            value={smsForm.message}
            onChange={(event) => setSmsForm({ ...smsForm, message: event.target.value.slice(0, 160) })}
            rows={5}
            className="rounded-2xl"
          />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{smsForm.message.length}/160 characters</span>
            <span>Estimated recipients: 890</span>
          </div>
          <Button className="w-fit rounded-2xl bg-amber text-white hover:bg-amber-light">
            <Send className="mr-2 h-4 w-4" />
            Send SMS
          </Button>
        </ComposerPanel>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ComposerPanel({
  title,
  description,
  channelIcon,
  children,
}: {
  title: string;
  description: string;
  channelIcon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AdminPanel title={title} description={description}>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.25rem] bg-slate-950 p-6 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber text-white">
            {channelIcon}
          </div>
          <h3 className="mt-5 font-heading text-2xl font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </AdminPanel>
  );
}

function CampaignFields({
  segment,
  onSegmentChange,
}: {
  segment: string;
  onSegmentChange: (segment: string) => void;
}) {
  return (
    <select
      value={segment}
      onChange={(event) => onSegmentChange(event.target.value)}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber/20"
    >
      <option value="all">All customers</option>
      <option value="loyal">Loyalty members</option>
      <option value="inactive">Inactive customers</option>
      <option value="high-value">High-value customers</option>
    </select>
  );
}
