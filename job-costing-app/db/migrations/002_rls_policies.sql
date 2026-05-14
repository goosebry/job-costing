-- Job Costing Application - Row Level Security Policies
-- Migration 002: Enable RLS on all tenant-scoped tables

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Create application role for API access
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'app_user_secure_password';
    END IF;
END
$$;

-- Function to get current user's organization ID
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_org_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set org context (called by auth middleware)
CREATE OR REPLACE FUNCTION set_org_context(org_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_org_id', org_id::TEXT, false);
    PERFORM set_config('app.current_user_id', user_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for organizations
CREATE POLICY org_isolation_select ON organizations
    FOR SELECT USING (id = get_current_org_id());

CREATE POLICY org_isolation_update ON organizations
    FOR UPDATE USING (id = get_current_org_id());

-- RLS Policies for users
CREATE POLICY users_org_isolation_select ON users
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY users_org_isolation_insert ON users
    FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY users_org_isolation_update ON users
    FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY users_org_isolation_delete ON users
    FOR DELETE USING (organization_id = get_current_org_id());

-- RLS Policies for roles
CREATE POLICY roles_org_isolation_select ON roles
    FOR SELECT USING (organization_id = get_current_org_id() OR organization_id IS NULL);

CREATE POLICY roles_org_isolation_all ON roles
    FOR ALL USING (organization_id = get_current_org_id() OR organization_id IS NULL);

-- RLS Policies for job_templates
CREATE POLICY templates_org_isolation_select ON job_templates
    FOR SELECT USING (organization_id = get_current_org_id() OR organization_id IS NULL);

CREATE POLICY templates_org_isolation_all ON job_templates
    FOR ALL USING (organization_id = get_current_org_id());

-- RLS Policies for job_statuses
CREATE POLICY statuses_org_isolation_select ON job_statuses
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY statuses_org_isolation_all ON job_statuses
    FOR ALL USING (organization_id = get_current_org_id());

-- RLS Policies for jobs
CREATE POLICY jobs_org_isolation_select ON jobs
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY jobs_org_isolation_insert ON jobs
    FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY jobs_org_isolation_update ON jobs
    FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY jobs_org_isolation_delete ON jobs
    FOR DELETE USING (organization_id = get_current_org_id());

-- RLS Policies for cost_categories
CREATE POLICY categories_org_isolation_select ON cost_categories
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY categories_org_isolation_all ON cost_categories
    FOR ALL USING (organization_id = get_current_org_id());

-- RLS Policies for cost_codes
CREATE POLICY codes_org_isolation_select ON cost_codes
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY codes_org_isolation_all ON cost_codes
    FOR ALL USING (organization_id = get_current_org_id());

-- RLS Policies for cost_entries
CREATE POLICY cost_entries_org_isolation_select ON cost_entries
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY cost_entries_org_isolation_insert ON cost_entries
    FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY cost_entries_org_isolation_update ON cost_entries
    FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY cost_entries_org_isolation_delete ON cost_entries
    FOR DELETE USING (organization_id = get_current_org_id());

-- RLS Policies for labor_entries
CREATE POLICY labor_entries_org_isolation_select ON labor_entries
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY labor_entries_org_isolation_insert ON labor_entries
    FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY labor_entries_org_isolation_update ON labor_entries
    FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY labor_entries_org_isolation_delete ON labor_entries
    FOR DELETE USING (organization_id = get_current_org_id());

-- RLS Policies for budget_lines
CREATE POLICY budget_lines_org_isolation_select ON budget_lines
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY budget_lines_org_isolation_all ON budget_lines
    FOR ALL USING (organization_id = get_current_org_id());

-- RLS Policies for change_orders
CREATE POLICY change_orders_org_isolation_select ON change_orders
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY change_orders_org_isolation_all ON change_orders
    FOR ALL USING (organization_id = get_current_org_id());

-- RLS Policies for invoices
CREATE POLICY invoices_org_isolation_select ON invoices
    FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY invoices_org_isolation_all ON invoices
    FOR ALL USING (organization_id = get_current_org_id());

-- RLS Policies for invoice_line_items (inherits from parent invoice)
CREATE POLICY line_items_org_isolation_select ON invoice_line_items
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE organization_id = get_current_org_id()
        )
    );

CREATE POLICY line_items_org_isolation_all ON invoice_line_items
    FOR ALL USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE organization_id = get_current_org_id()
        )
    );

-- RLS Policies for notifications
CREATE POLICY notifications_user_isolation_select ON notifications
    FOR SELECT USING (user_id = get_current_user_id() OR organization_id = get_current_org_id());

CREATE POLICY notifications_user_isolation_update ON notifications
    FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY notifications_user_isolation_insert ON notifications
    FOR INSERT WITH CHECK (organization_id = get_current_org_id());

-- RLS Policies for audit_logs
CREATE POLICY audit_logs_org_isolation_select ON audit_logs
    FOR SELECT USING (organization_id = get_current_org_id() OR organization_id IS NULL);

CREATE POLICY audit_logs_org_isolation_insert ON audit_logs
    FOR INSERT WITH CHECK (organization_id = get_current_org_id() OR organization_id IS NULL);

-- RLS Policies for refresh_tokens
CREATE POLICY refresh_tokens_user_isolation_select ON refresh_tokens
    FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY refresh_tokens_user_isolation_all ON refresh_tokens
    FOR ALL USING (user_id = get_current_user_id());

-- Grant app_user permissions
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON FUNCTION get_current_org_id() TO app_user;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO app_user;
GRANT EXECUTE ON FUNCTION set_org_context(UUID, UUID) TO app_user;