-- Job Costing Application - Job Templates
-- Migration 004: 3 default templates (Contractor, Real Estate, Manufacturer)

-- Insert job templates
INSERT INTO job_templates (name, description, default_statuses) VALUES
    ('Contractor', 'Standard contractor job template with full workflow', '[
        {"name": "Draft", "color": "#6B7280", "is_terminal": false, "sort_order": 1},
        {"name": "Bidding", "color": "#3B82F6", "is_terminal": false, "sort_order": 2},
        {"name": "Active", "color": "#16A34A", "is_terminal": false, "sort_order": 3},
        {"name": "On Hold", "color": "#CA8A04", "is_terminal": false, "sort_order": 4},
        {"name": "Completed", "color": "#1E40AF", "is_terminal": true, "sort_order": 5},
        {"name": "Closed", "color": "#111827", "is_terminal": true, "sort_order": 6}
    ]'),
    ('Real Estate', 'Real estate project template', '[
        {"name": "Lead", "color": "#6B7280", "is_terminal": false, "sort_order": 1},
        {"name": "Under Contract", "color": "#3B82F6", "is_terminal": false, "sort_order": 2},
        {"name": "In Progress", "color": "#16A34A", "is_terminal": false, "sort_order": 3},
        {"name": "Inspection", "color": "#CA8A04", "is_terminal": false, "sort_order": 4},
        {"name": "Closed", "color": "#111827", "is_terminal": true, "sort_order": 5}
    ]'),
    ('Manufacturer', 'Manufacturing job template', '[
        {"name": "Engineering", "color": "#6B7280", "is_terminal": false, "sort_order": 1},
        {"name": "Production", "color": "#3B82F6", "is_terminal": false, "sort_order": 2},
        {"name": "QC Check", "color": "#CA8A04", "is_terminal": false, "sort_order": 3},
        {"name": "Completed", "color": "#16A34A", "is_terminal": true, "sort_order": 4}
    ]');