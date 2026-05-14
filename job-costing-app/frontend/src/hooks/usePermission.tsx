import { useAuth } from './useAuth';

export type Permission =
  | 'jobs:read'
  | 'jobs:write'
  | 'costs:read'
  | 'costs:write'
  | 'labor:read'
  | 'labor:write'
  | 'budgets:read'
  | 'budgets:write'
  | 'invoices:read'
  | 'invoices:write'
  | 'reports:read'
  | 'reports:write'
  | 'notifications:read'
  | 'notifications:write'
  | 'users:read'
  | 'users:write'
  | 'settings:read'
  | 'settings:write'
  | 'change_orders:read'
  | 'change_orders:write'
  | 'approve:change_orders';

interface PermissionContext {
  hasPermission: (permission: Permission | string) => boolean;
  hasAnyPermission: (permissions: (Permission | string)[]) => boolean;
}

export function usePermission(permission?: Permission | string): any {
  const { user } = useAuth();

  const hasPermission = (perm: Permission | string): boolean => {
    if (!user) return false;
    // Get permissions from organization or user role-based defaults
    const userPermissions = (user as any).permissions || [];
    const rolePermissions = getRolePermissions(user.role);
    const allPermissions = [...userPermissions, ...rolePermissions];
    return allPermissions.includes(perm) || allPermissions.includes('*');
  };

  const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  // Support usePermission('permission') → returns boolean directly
  if (permission !== undefined) {
    return hasPermission(permission);
  }

  // Support { can } and { hasPermission, hasAnyPermission } destructuring
  return { hasPermission, hasAnyPermission, can: hasPermission };
}

function getRolePermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    ADMIN: [
      'jobs:read', 'jobs:write', 'jobs:create',
      'costs:read', 'costs:write',
      'labor:read', 'labor:write',
      'budgets:read', 'budgets:write',
      'invoices:read', 'invoices:write',
      'reports:read', 'reports:write', 'reports:export',
      'notifications:read', 'notifications:write',
      'users:read', 'users:write',
      'settings:read', 'settings:write',
      'change_orders:read', 'change_orders:write',
      'change-orders:approve',
      'approve:change_orders',
    ],
    PROJECT_MANAGER: [
      'jobs:read', 'jobs:write',
      'costs:read', 'costs:write',
      'labor:read', 'labor:write',
      'budgets:read', 'budgets:write',
      'invoices:read', 'invoices:write',
      'reports:read', 'reports:write',
      'notifications:read', 'notifications:write',
      'settings:read',
      'change_orders:read', 'change_orders:write',
      'approve:change_orders',
    ],
    COST_ACCOUNTANT: [
      'jobs:read',
      'costs:read', 'costs:write',
      'labor:read',
      'budgets:read',
      'invoices:read', 'invoices:write',
      'reports:read', 'reports:write',
      'notifications:read',
    ],
    FIELD_WORKER: [
      'jobs:read',
      'costs:read',
      'labor:read', 'labor:write',
      'notifications:read',
    ],
  };

  return rolePermissions[role] || [];
}