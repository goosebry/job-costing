import { NavLink } from 'react-router-dom';

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { to: '/settings/organization', label: 'Organization' },
    { to: '/settings/categories', label: 'Cost Categories' },
    { to: '/settings/job-statuses', label: 'Job Statuses' },
    { to: '/settings/job-templates', label: 'Job Templates' },
    { to: '/settings/users', label: 'Users & Roles' },
  ];

  const adminNavItems = [
    { to: '/settings/workspace', label: '⚙️ Workspace & Data' },
  ];

  return (
    <div className="flex gap-6">
      <nav className="w-52 shrink-0 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <div className="pt-3 pb-1">
          <div className="border-t border-gray-200" />
          <p className="text-[11px] uppercase tracking-wider text-gray-400 px-4 pt-2 pb-1 font-medium">Admin</p>
        </div>
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-rose-50 text-rose-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}