'use client';

import { useEffect, useState } from 'react';
import { notificationsApi } from '@/services/api';
import { format } from 'date-fns';

const typeIcons: Record<string, string> = {
  BUDGET_WARNING: '⚠️',
  STATUS_CHANGE: '📋',
  APPROVAL_REQUIRED: '✅',
  INVOICE_SENT: '🧾',
  GENERAL: '📢',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationsApi.list({ limit: 50 });
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated with important alerts and changes</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary">Mark all as read</button>
        )}
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <span className="text-sm text-gray-500">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</span>
        </div>
        <div className="card-body p-0">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No notifications</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${notification.isRead ? 'opacity-60' : ''}`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">{typeIcons[notification.type] || typeIcons.GENERAL}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                      {notification.relatedJobId && (
                        <a href={`/jobs/${notification.relatedJobId}`} className="text-xs text-primary-600 hover:underline mt-2 inline-block">
                          View Job →
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}