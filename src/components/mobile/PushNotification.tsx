'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Tag, Truck, ShoppingBag, X } from 'lucide-react';
import { useSSE } from '@/hooks/use-sse';
import type { SSEEvent } from '@/types';

interface Notification {
  id: string;
  title: string;
  body: string;
  icon: 'order' | 'discount' | 'delivery';
}

export function PushNotification() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setNotification(null), 300);
  }, []);

  const showNotification = useCallback(
    (title: string, body: string, icon: Notification['icon'] = 'order') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const id = Date.now().toString();
      setNotification({ id, title, body, icon });
      setVisible(true);

      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, 4000);
    },
    [dismiss]
  );

  const handleSSEEvent = useCallback(
    (event: SSEEvent) => {
      if (event.type === 'order-updated') {
        const data = event.data;
        const orderNumber = data?.orderNumber || '';
        const status = data?.status || '';
        const orderType = data?.orderType || '';

        // Only show notifications for pickup and delivery orders
        if (orderType === 'dine-in') return;

        // Map status to friendly message
        let message = '';
        let icon: Notification['icon'] = 'order';

        switch (status) {
          case 'preparing':
            message = `Your order ${orderNumber} is being prepared`;
            icon = 'order';
            break;
          case 'ready':
            message = orderType === 'pickup'
              ? `Order ${orderNumber} is ready for collection!`
              : `Order ${orderNumber} is ready for delivery`;
            icon = 'order';
            break;
          case 'out-for-delivery':
            message = `Order ${orderNumber} is on its way to you!`;
            icon = 'delivery';
            break;
          case 'delivered':
            message = `Order ${orderNumber} has been delivered!`;
            icon = 'delivery';
            break;
          case 'collected':
            message = `Order ${orderNumber} has been picked up!`;
            icon = 'order';
            break;
          default:
            return; // Don't show notification for other statuses
        }

        showNotification('Order Update', message, icon);
      } else if (event.type === 'delivery-updated') {
        const data = event.data;
        const status = data?.status || '';

        let message = '';
        switch (status) {
          case 'rider-assigned':
            message = 'A rider has been assigned to your order';
            break;
          case 'en-route-to-restaurant':
            message = 'Your rider is heading to the restaurant';
            break;
          case 'collecting':
            message = 'Your rider is picking up your order';
            break;
          case 'en-route-to-customer':
            message = 'Your order is on its way!';
            break;
          case 'delivered':
            message = 'Your order has been delivered!';
            break;
          default:
            return;
        }

        showNotification('Delivery Update', message, 'delivery');
      } else if (event.type === 'new-discount-code') {
        const data = event.data;
        const code = data?.code || '';
        const type = data?.type || '';
        const value = data?.value || 0;

        const discountText = type === 'percentage' ? `${value}% off` : `£${value} off`;
        showNotification(
          'New Offer!',
          `Use code ${code} for ${discountText} your next order`,
          'discount'
        );
      }
    },
    [showNotification]
  );

  useSSE({
    onEvent: handleSSEEvent,
    eventTypes: ['order-updated', 'delivery-updated', 'new-discount-code'],
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!notification) return null;

  const iconConfig = {
    order: { bg: 'bg-amber/10', icon: <ShoppingBag className="h-4 w-4 text-amber" /> },
    delivery: { bg: 'bg-blue-50', icon: <Truck className="h-4 w-4 text-blue-600" /> },
    discount: { bg: 'bg-green-50', icon: <Tag className="h-4 w-4 text-green-600" /> },
  };

  const { bg, icon } = iconConfig[notification.icon];

  return (
    <div
      className={`absolute top-2 left-2 right-2 z-[60] transition-all duration-300 ${
        visible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur-sm border border-gray-100">
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-charcoal">
            {notification.title}
          </p>
          <p className="text-xs text-charcoal-light truncate">
            {notification.body}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-charcoal-light/60 hover:text-charcoal"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
