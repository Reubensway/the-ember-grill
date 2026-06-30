'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { useSSE } from '@/hooks/use-sse';
import type { OrderStatus, OrderType, DeliveryStatus, SSEEvent } from '@/types';

const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'received', label: 'Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
];

const DELIVERY_STEPS: { key: DeliveryStatus; label: string }[] = [
  { key: 'rider-assigned', label: 'Rider Assigned' },
  { key: 'en-route-to-restaurant', label: 'En Route to Restaurant' },
  { key: 'collecting', label: 'Collecting' },
  { key: 'en-route-to-customer', label: 'En Route to You' },
  { key: 'delivered', label: 'Delivered' },
];

function getOrderSteps(orderType: OrderType | null): { key: string; label: string }[] {
  const base = [...ORDER_STEPS];
  if (orderType === 'delivery') {
    base.push({ key: 'out-for-delivery', label: 'Out for Delivery' });
    base.push({ key: 'delivered', label: 'Delivered' });
  } else if (orderType === 'dine-in') {
    base.push({ key: 'served', label: 'Served' });
  } else {
    base.push({ key: 'collected', label: 'Collected' });
  }
  return base;
}

function getStepIndex(steps: { key: string }[], currentStatus: string): number {
  return steps.findIndex((s) => s.key === currentStatus);
}

function getEstimatedTime(orderType: OrderType | null): string {
  if (orderType === 'delivery') return '30–45 minutes';
  return '15–20 minutes';
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-charcoal-light">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const orderTypeParam = searchParams.get('orderType') as OrderType | null;

  const [orderStatus, setOrderStatus] = useState<OrderStatus>('received');
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(null);
  const [orderType, setOrderType] = useState<OrderType | null>(orderTypeParam);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Fetch initial order status from API
  useEffect(() => {
    if (!orderNumber) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders?status=&orderType=`);
        if (!res.ok) return;
        const data = await res.json();
        const order = data.orders?.find(
          (o: { orderNumber: string }) => o.orderNumber === orderNumber
        );
        if (order) {
          setOrderStatus(order.status);
          setOrderId(order.id);
          if (!orderType) setOrderType(order.orderType);
          if (order.delivery) {
            setDeliveryStatus(order.delivery.status);
          }
        }
      } catch {
        // Silently fail — we still show the default status
      }
    }

    fetchOrder();
  }, [orderNumber, orderType]);

  // Listen for real-time order updates via SSE
  const handleSSEEvent = useCallback(
    (event: SSEEvent) => {
      if (event.type === 'order-updated' && event.data?.orderNumber === orderNumber) {
        setOrderStatus(event.data.status);
      }
      if (event.type === 'delivery-updated' && orderId && event.data?.orderId === orderId) {
        setDeliveryStatus(event.data.status);
      }
    },
    [orderNumber, orderId]
  );

  useSSE({
    onEvent: handleSSEEvent,
    eventTypes: ['order-updated', 'delivery-updated'],
  });

  const steps = getOrderSteps(orderType);
  const currentStepIndex = getStepIndex(steps, orderStatus);

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-cream py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <CheckCircle2 className="mx-auto mb-6 h-20 w-20 text-green-500" />
          <h1 className="mb-4 font-heading text-3xl font-bold text-charcoal">
            Order Confirmed!
          </h1>
          {orderNumber && (
            <p className="mb-2 text-lg text-charcoal">
              Order Number:{' '}
              <span className="font-semibold text-amber">{orderNumber}</span>
            </p>
          )}
          <p className="mb-8 text-charcoal-light">
            Thank you for your order. We&apos;re preparing it now.
          </p>
        </motion.div>

        {/* Estimated Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 rounded-lg border border-amber/20 bg-amber/5 p-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-amber" />
            <span className="text-sm font-medium text-charcoal">
              Estimated Time
            </span>
          </div>
          <p className="text-xl font-semibold text-amber">
            {getEstimatedTime(orderType)}
          </p>
          <p className="mt-1 text-xs text-charcoal-light">
            {orderType === 'delivery'
              ? 'Including delivery to your address'
              : orderType === 'dine-in'
              ? 'Your food will be served to your table'
              : 'Your order will be ready for collection'}
          </p>
        </motion.div>

        {/* Order Status Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6 rounded-lg border border-gray-200 bg-white p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-charcoal">
              Order Status
            </h2>
            <OrderStatusBadge status={orderStatus} />
          </div>

          {/* Progress Steps */}
          <div className="relative">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex items-start gap-3 relative">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-[11px] top-6 w-0.5 h-8 ${
                        index < currentStepIndex
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                  {/* Step dot */}
                  <div
                    className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      isCompleted
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </div>
                  {/* Step label */}
                  <span
                    className={`pb-8 text-sm ${
                      isCurrent
                        ? 'font-semibold text-charcoal'
                        : isCompleted
                        ? 'text-green-700'
                        : 'text-charcoal-light'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Delivery Status (for delivery orders) */}
        {orderType === 'delivery' && deliveryStatus && deliveryStatus !== 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-purple-600" />
              <h2 className="font-heading text-lg font-semibold text-charcoal">
                Delivery Tracking
              </h2>
            </div>

            <div className="relative">
              {DELIVERY_STEPS.map((step, index) => {
                const deliveryStepIndex = DELIVERY_STEPS.findIndex(
                  (s) => s.key === deliveryStatus
                );
                const isCompleted = index <= deliveryStepIndex;
                const isCurrent = index === deliveryStepIndex;

                return (
                  <div key={step.key} className="flex items-start gap-3 relative">
                    {index < DELIVERY_STEPS.length - 1 && (
                      <div
                        className={`absolute left-[11px] top-6 w-0.5 h-8 ${
                          index < deliveryStepIndex
                            ? 'bg-purple-500'
                            : 'bg-purple-200'
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-purple-200 bg-white'
                      }`}
                    >
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span
                      className={`pb-8 text-sm ${
                        isCurrent
                          ? 'font-semibold text-purple-800'
                          : isCompleted
                          ? 'text-purple-700'
                          : 'text-purple-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Back to Menu button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <Button
            render={<Link href="/menu" />}
            className="bg-amber text-white hover:bg-amber-light"
          >
            Back to Menu
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
