'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') ?? '—';
  const orderType = searchParams.get('orderType') ?? 'pickup';

  const messages: Record<string, string> = {
    'dine-in': 'Your order will be served to your table shortly.',
    pickup: 'Your order will be ready for collection in 15–20 minutes.',
    delivery: 'Your order is on its way!',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h1 className="font-heading text-2xl font-bold text-charcoal">
        Order Confirmed!
      </h1>
      <p className="text-sm text-charcoal-light">
        {messages[orderType] ?? messages.pickup}
      </p>
      <div className="rounded-xl bg-white px-6 py-4 shadow-sm">
        <p className="text-xs text-charcoal-light">Order Number</p>
        <p className="text-lg font-bold text-amber">{orderNumber}</p>
      </div>
      <Link
        href="/mobile/orders"
        className="mt-4 rounded-full bg-amber px-6 py-2.5 text-sm font-semibold text-white active:bg-amber-light"
      >
        View Orders
      </Link>
    </div>
  );
}

export default function MobileConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-charcoal-light">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
