-- Job Costing Application - System Roles
-- Migration 003: 4 default roles with 15 permissions

-- Insert all permissions
INSERT INTO permissions (name, description) VALUES
    ('job_management', 'Create, edit, and manage jobs'),
    ('cost_entry', 'Create and submit cost entries'),
    ('cost_entry_edit', 'Edit own cost entries'),
    ('cost_entry_delete', 'Delete own cost entries'),
    ('labor_entry', 'Create and submit labor entries'),
    ('labor_entry_approve', 'Approve or reject labor entries'),
    ('budget_view', 'View budget information'),
    ('budget_edit', 'Create and edit budget lines'),
    ('change_order_submit', 'Submit change orders'),
    ('change_order_approve', 'Approve or reject change orders'),
    ('invoice_generate', 'Generate invoices'),
    ('invoice_view', 'View invoices'),
    ('report_run', 'Run and view reports'),
    ('report_export', 'Export reports'),
    ('user_management', 'Manage users'),
    ('role_management', 'Manage roles'),
    ('notification_manage', 'Manage notifications and alerts');

-- Admin role (all permissions)
INSERT INTO roles (name, permissions, is_system_role) VALUES
    ('Admin', ARRAY[
        'job_management', 'cost_entry', 'cost_entry_edit', 'cost_entry_delete',
        'labor_entry', 'labor_entry_approve', 'budget_view', 'budget_edit',
        'change_order_submit', 'change_order_approve', 'invoice_generate',
        'invoice_view', 'report_run', 'report_export', 'user_management',
        'role_management', 'notification_manage'
    ], true);

-- Project Manager role
INSERT INTO roles (name, permissions, is_system_role) VALUES
    ('Project Manager', ARRAY[
        'job_management', 'cost_entry', 'cost_entry_edit',
        'labor_entry', 'labor_entry_approve', 'budget_view', 'budget_edit',
        'change_order_submit', 'change_order_approve', 'invoice_view',
        'report_run', 'report_export', 'notification_manage'
    ], true);

-- Cost Accountant role
INSERT INTO roles (name, permissions, is_system_role) VALUES
    ('Cost Accountant', ARRAY[
        'cost_entry', 'cost_entry_edit', 'cost_entry_delete',
        'labor_entry', 'budget_view', 'budget_edit',
        'change_order_submit', 'invoice_generate', 'invoice_view',
        'report_run', 'report_export', 'notification_manage'
    ], true);

-- Field Worker role
INSERT INTO roles (name, permissions, is_system_role) VALUES
    ('Field Worker', ARRAY[
        'job_management', 'cost_entry', 'cost_entry_edit', 'cost_entry_delete',
        'labor_entry', 'budget_view', 'report_run', 'notification_manage'
    ], true);