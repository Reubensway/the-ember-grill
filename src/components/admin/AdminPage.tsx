'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'amber' | 'blue' | 'green' | 'purple' | 'red' | 'slate';
  helper?: string;
}

const toneStyles = {
  amber: 'bg-amber/10 text-amber ring-amber/15',
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  purple: 'bg-violet-50 text-violet-600 ring-violet-100',
  red: 'bg-rose-50 text-rose-600 ring-rose-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  helper,
}: AdminStatCardProps) {
  return (
    <Card className="rounded-[1.4rem] border border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/60 ring-1 ring-slate-900/[0.03] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
        </div>
        <div className={cn('rounded-2xl p-3 ring-1', toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

interface AdminPanelProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  children: React.ReactNode;
}

export function AdminPanel({
  title,
  description,
  actionHref,
  actionLabel,
  className,
  children,
}: AdminPanelProps) {
  return (
    <Card
      className={cn(
        'rounded-[1.4rem] border border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/60 ring-1 ring-slate-900/[0.03] backdrop-blur',
        className
      )}
    >
      {(title || actionHref) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="font-heading text-lg font-semibold text-slate-950">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber hover:text-amber-light"
            >
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <div className="rounded-2xl bg-white p-3 text-slate-300 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size="sm"
          className="mt-4 rounded-xl bg-amber text-white hover:bg-amber-light"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function AdminPageGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
