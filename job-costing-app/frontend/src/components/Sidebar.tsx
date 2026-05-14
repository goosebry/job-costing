import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/jobs', label: 'Jobs', icon: '📋' },
  { to: '/clients', label: 'Clients', icon: '🏢' },
  { to: '/costs', label: 'Costs', icon: '💰' },
  { to: '/labor', label: 'Labor', icon: '⏱️' },
  { to: '/budgets', label: 'Budgets', icon: '📈' },
  { to: '/change-orders', label: 'Change Orders', icon: '📝' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/approvals', label: 'Approvals', icon: '✅' },
  { to: '/reports', label: 'Reports', icon: '📉' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Count genuinely pending change orders — the source of truth for the badge
  const { data: pendingApprovalsData } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const response = await fetch('/api/change-orders/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) return { count: 0 };
      const orders = await response.json();
      return { count: Array.isArray(orders) ? orders.length : 0 };
    },
    refetchInterval: 10000, // Re-check every 10 seconds
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">Job Costing</h1>
        <p className="text-sm text-gray-500 mt-1">{user?.organization?.name || 'Organization'}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <span>{item.icon}</span>
              {item.label}
            </span>
            {item.to === '/approvals' && (pendingApprovalsData?.count ?? 0) > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingApprovalsData!.count}
              </span>
            )}

          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-medium">
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}