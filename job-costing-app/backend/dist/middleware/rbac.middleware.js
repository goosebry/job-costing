"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requirePermission = exports.Permissions = void 0;
var Permissions;
(function (Permissions) {
    Permissions["JOBS_CREATE"] = "jobs:create";
    Permissions["JOBS_READ"] = "jobs:read";
    Permissions["JOBS_UPDATE"] = "jobs:update";
    Permissions["JOBS_DELETE"] = "jobs:delete";
    Permissions["COSTS_CREATE"] = "costs:create";
    Permissions["COSTS_READ"] = "costs:read";
    Permissions["COSTS_UPDATE"] = "costs:update";
    Permissions["COSTS_DELETE"] = "costs:delete";
    Permissions["LABOR_CREATE"] = "labor:create";
    Permissions["LABOR_READ"] = "labor:read";
    Permissions["LABOR_UPDATE"] = "labor:update";
    Permissions["LABOR_DELETE"] = "labor:delete";
    Permissions["BUDGETS_READ"] = "budgets:read";
    Permissions["BUDGETS_UPDATE"] = "budgets:update";
    Permissions["INVOICES_CREATE"] = "invoices:create";
    Permissions["INVOICES_READ"] = "invoices:read";
    Permissions["INVOICES_UPDATE"] = "invoices:update";
    Permissions["INVOICES_DELETE"] = "invoices:delete";
    Permissions["CHANGE_ORDERS_READ"] = "change-orders:read";
    Permissions["CHANGE_ORDERS_APPROVE"] = "change-orders:approve";
    Permissions["USERS_MANAGE"] = "users:manage";
    Permissions["SETTINGS_MANAGE"] = "settings:manage";
    Permissions["REPORTS_EXPORT"] = "reports:export";
    Permissions["NOTIFICATIONS_READ"] = "notifications:read";
    Permissions["NOTIFICATIONS_WRITE"] = "notifications:write";
})(Permissions || (exports.Permissions = Permissions = {}));
const rolePermissions = {
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
const requirePermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
            return;
        }
        const userRole = req.user.role;
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
exports.requirePermission = requirePermission;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
            return;
        }
        const userRole = req.user.role;
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
exports.requireRole = requireRole;
//# sourceMappingURL=rbac.middleware.js.map