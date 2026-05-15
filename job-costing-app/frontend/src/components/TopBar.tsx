import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
}

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4 flex-shrink-0">
      <div className="flex items-center justify-between gap-3">

        {/* Left: hamburger (mobile) + new job button */}
        <div className="flex items-center gap-3">
          {/* Hamburger — only shown on mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand name — mobile only (hidden on desktop where sidebar shows it) */}
          <span className="lg:hidden text-base font-bold text-primary-600">Job Costing</span>

          {/* New Job — hidden on mobile to save space */}
          <Link to="/jobs/new" className="btn-primary hidden sm:inline-flex text-sm">
            + New Job
          </Link>
        </div>

        {/* Right: connection status + notifications */}
        <div className="flex items-center gap-3">
          {/* Connection dot — hide label on tiny screens */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="hidden sm:inline text-sm text-gray-500">{isConnected ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-w-[calc(100vw-2rem)]">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-4 border-b border-gray-100 ${!n.isRead ? 'bg-primary-50' : ''}`}>
                        <p className="font-medium text-sm text-gray-900">{n.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}