import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { OrganizationUserRole } from '@prisma/client';

export enum Permissions {
  JOBS_CREATE = 'jobs:create',
  JOBS_READ = 'jobs:read',
  JOBS_UPDATE = 'jobs:update',
  JOBS_DELETE = 'jobs:delete',
  COSTS_CREATE = 'costs:create',
  COSTS_READ = 'costs:read',
  COSTS_UPDATE = 'costs:update',
  COSTS_DELETE = 'costs:delete',
  LABOR_CREATE = 'labor:create',
  LABOR_READ = 'labor:read',
  LABOR_UPDATE = 'labor:update',
  LABOR_DELETE = 'labor:delete',
  BUDGETS_READ = 'budgets:read',
  BUDGETS_UPDATE = 'budgets:update',
  INVOICES_CREATE = 'invoices:create',
  INVOICES_READ = 'invoices:read',
  INVOICES_UPDATE = 'invoices:update',
  INVOICES_DELETE = 'invoices:delete',
  CHANGE_ORDERS_READ = 'change-orders:read',
  CHANGE_ORDERS_APPROVE = 'change-orders:approve',
  USERS_MANAGE = 'users:manage',
  SETTINGS_MANAGE = 'settings:manage',
  REPORTS_EXPORT = 'reports:export',
  NOTIFICATIONS_READ = 'notifications:read',
  NOTIFICATIONS_WRITE = 'notifications:write',
}

type Permission =
  | 'jobs:create'
  | 'jobs:read'
  | 'jobs:update'
  | 'jobs:delete'
  | 'costs:create'
  | 'costs:read'
  | 'costs:update'
  | 'costs:delete'
  | 'labor:create'
  | 'labor:read'
  | 'labor:update'
  | 'labor:delete'
  | 'budgets:read'
  | 'budgets:update'
  | 'invoices:create'
  | 'invoices:read'
  | 'invoices:update'
  | 'invoices:delete'
  | 'change-orders:approve'
  | 'users:manage'
  | 'settings:manage'
  | 'reports:export'
  | 'notifications:read'
  | 'notifications:write';

const rolePermissions: Record<OrganizationUserRole, Permission[]> = {
  ADMIN: [
    'jobs:create', 'jobs:read', 'jobs:update', 'jobs:delete',
    'costs:create', 'costs:read', 'costs:update', 'costs:delete',
    'labor:create', 'labor:read', 'labor:update', 'labor:delete',
    'budgets:read', 'budgets:update',
    'invoices:create', 'invoices:read', 'invoices:update', 'invoices:delete',
    'change-orders:approve',
    'users:manage', 'settings:manage', 'reports:export',
    'notifications:read', 'notifications:write',
  ],
  PROJECT_MANAGER: [
    'jobs:create', 'jobs:read', 'jobs:update',
    'costs:create', 'costs:read', 'costs:update',
    'labor:create', 'labor:read', 'labor:update',
    'budgets:read', 'budgets:update',
    'invoices:create', 'invoices:read',
    'change-orders:approve',
    'reports:export',
    'notifications:read', 'notifications:write',
  ],
  COST_ACCOUNTANT: [
    'jobs:read',
    'costs:create', 'costs:read', 'costs:update',
    'labor:read',
    'budgets:read',
    'invoices:create', 'invoices:read', 'invoices:update',
    'change-orders:approve',
    'reports:export',
    'notifications:read',
  ],
  FIELD_WORKER: [
    'jobs:read',
    'costs:create', 'costs:read',
    'labor:create', 'labor:read', 'labor:update',
    'notifications:read',
  ],
};

export const requirePermission = (...permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const userRole = req.user.role as OrganizationUserRole;
    const userPermissions = rolePermissions[userRole] || [];

    const hasPermission = permissions.every(permission => userPermissions.includes(permission));

    if (!hasPermission) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this action',
        required: permissions,
      });
      return;
    }

    next();
  };
};

export const requireRole = (...roles: OrganizationUserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const userRole = req.user.role as OrganizationUserRole;

    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient role for this action',
        required: roles,
      });
      return;
    }

    next();
  };
};