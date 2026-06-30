'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Truck, Tag, UtensilsCrossed } from 'lucide-react';

interface Notification {
  id: string;
  icon: 'bell' | 'truck' | 'tag' | 'utensils';
  title: string;
  description: string;
  timeAgo: string;
  unread: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: 'truck',
    title: 'Order Delivered',
    description: 'Your order EMB-003 has been delivered',
    timeAgo: '2 hours ago',
    unread: true,
  },
  {
    id: '2',
    icon: 'utensils',
    title: 'Order Update',
    description: 'Your order EMB-007 is being prepared',
    timeAgo: '5 hours ago',
    unread: true,
  },
  {
    id: '3',
    icon: 'tag',
    title: 'Welcome Offer',
    description: 'Welcome to The Ember Grill! Enjoy 10% off with code EMBER10',
    timeAgo: '1 day ago',
    unread: false,
  },
  {
    id: '4',
    icon: 'utensils',
    title: 'New Menu Items',
    description: 'New items added to our Grill menu',
    timeAgo: '3 days ago',
    unread: false,
  },
];

function NotificationIcon({ type }: { type: Notification['icon'] }) {
  const iconMap = {
    bell: { icon: Bell, bg: 'bg-blue-100', color: 'text-blue-600' },
    truck: { icon: Truck, bg: 'bg-green-100', color: 'text-green-600' },
    tag: { icon: Tag, bg: 'bg-orange-100', color: 'text-orange-600' },
    utensils: { icon: UtensilsCrossed, bg: 'bg-purple-100', color: 'text-purple-600' },
  };

  const config = iconMap[type];
  const Icon = config.icon;

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg}`}>
      <Icon className={`h-5 w-5 ${config.color}`} />
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  return (
    <div className="flex flex-col px-4 py-4 bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No notifications</p>
          <p className="text-xs text-gray-500 mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 rounded-2xl p-4 transition-colors ${
                notification.unread ? 'bg-blue-50/50' : 'bg-white'
              } border border-gray-100`}
            >
              <NotificationIcon type={notification.icon} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {notification.title}
                  </p>
                  {notification.unread && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                  {notification.description}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {notification.timeAgo}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
