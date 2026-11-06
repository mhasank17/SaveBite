import React, { useState } from 'react';
import Button from '../../components/common/Button';

export interface NotificationItem {
  id: string;
  type: 'order' | 'deal' | 'milestone' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon: string;
  iconColor: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'order',
    title: 'Counter Pickup Reminder',
    message: 'Your order at The Daily Dough Bakery is ready for pickup tonight before 9:30 PM.',
    timestamp: '15 mins ago',
    read: false,
    actionUrl: '/app/customer/orders',
    actionLabel: 'View Pickup Pass',
    icon: 'storefront',
    iconColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'notif-2',
    type: 'deal',
    title: 'New Evening Surplus Listing',
    message: 'Fresh sourdough loaves & artisanal pastries just listed at 70% off near campus.',
    timestamp: '1 hour ago',
    read: false,
    actionUrl: '/app/customer/food-deals',
    actionLabel: 'Explore Deal',
    icon: 'lunch_dining',
    iconColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'notif-3',
    type: 'milestone',
    title: 'Eco Milestone Unlocked! 🌱',
    message: 'You have prevented 5.4 kg of CO2e emissions by rescuing surplus meals this week.',
    timestamp: 'Yesterday',
    read: true,
    actionUrl: '/app/customer/profile',
    actionLabel: 'View Eco Impact',
    icon: 'eco',
    iconColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'notif-4',
    type: 'system',
    title: 'Zero Waste Campus Initiative',
    message: 'SaveBite evening pickup windows have been extended across all campus partners.',
    timestamp: '2 days ago',
    read: true,
    icon: 'verified',
    iconColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

export interface CustomerNotificationsPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (type: 'success' | 'warning' | 'error' | 'info', message: string, title?: string) => void;
}

export const CustomerNotificationsPage: React.FC<CustomerNotificationsPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'orders' | 'deals'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (onShowToast) {
      onShowToast('info', 'All notifications marked as read.', 'Inbox Updated');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'orders') return n.type === 'order';
    if (filter === 'deals') return n.type === 'deal';
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-4 py-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006030] border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[26px]">notifications_active</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Customer Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pickup window reminders, surplus deal alerts, and campus eco milestones.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="self-stretch sm:self-auto text-xs font-bold"
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'orders', label: 'Orders', count: notifications.filter((n) => n.type === 'order').length },
          { id: 'deals', label: 'Food Deals', count: notifications.filter((n) => n.type === 'deal').length },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#006030] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                notif.read
                  ? 'bg-white border-slate-100 opacity-85'
                  : 'bg-white border-emerald-200/80 shadow-xs ring-1 ring-emerald-500/10'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${notif.iconColor}`}
              >
                <span className="material-symbols-outlined text-[22px]">{notif.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{notif.title}</h3>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                {notif.actionUrl && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                        onNavigate(notif.actionUrl!);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#006030] hover:text-[#004d26] transition-colors"
                    >
                      <span>{notif.actionLabel || 'View Details'}</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>

              {!notif.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100">
          <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[28px]">notifications_off</span>
          </div>
          <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            You're all caught up! New order updates, pickup alerts, and fresh surplus food deals will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerNotificationsPage;
