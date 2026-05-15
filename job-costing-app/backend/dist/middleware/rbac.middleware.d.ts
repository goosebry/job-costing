import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { OrganizationUserRole } from '@prisma/client';
export declare enum Permissions {
    JOBS_CREATE = "jobs:create",
    JOBS_READ = "jobs:read",
    JOBS_UPDATE = "jobs:update",
    JOBS_DELETE = "jobs:delete",
    COSTS_CREATE = "costs:create",
    COSTS_READ = "costs:read",
    COSTS_UPDATE = "costs:update",
    COSTS_DELETE = "costs:delete",
    LABOR_CREATE = "labor:create",
    LABOR_READ = "labor:read",
    LABOR_UPDATE = "labor:update",
    LABOR_DELETE = "labor:delete",
    BUDGETS_READ = "budgets:read",
    BUDGETS_UPDATE = "budgets:update",
    INVOICES_CREATE = "invoices:create",
    INVOICES_READ = "invoices:read",
    INVOICES_UPDATE = "invoices:update",
    INVOICES_DELETE = "invoices:delete",
    CHANGE_ORDERS_READ = "change-orders:read",
    CHANGE_ORDERS_APPROVE = "change-orders:approve",
    USERS_MANAGE = "users:manage",
    SETTINGS_MANAGE = "settings:manage",
    REPORTS_EXPORT = "reports:export"
}
type Permission = 'jobs:create' | 'jobs:read' | 'jobs:update' | 'jobs:delete' | 'costs:create' | 'costs:read' | 'costs:update' | 'costs:delete' | 'labor:create' | 'labor:read' | 'labor:update' | 'labor:delete' | 'invoices:create' | 'invoices:read' | 'invoices:update' | 'invoices:delete' | 'change-orders:approve' | 'users:manage' | 'settings:manage' | 'reports:export';
export declare const requirePermission: (...permissions: Permission[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireRole: (...roles: OrganizationUserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=rbac.middleware.d.ts.map