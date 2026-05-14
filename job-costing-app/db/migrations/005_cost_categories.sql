-- Job Costing Application - Cost Categories
-- Migration 005: 5 default cost categories with sub-codes

-- Insert cost categories
INSERT INTO cost_categories (name, description, type) VALUES
    ('Direct Labor', 'Labor costs directly attributable to job execution', 'labor'),
    ('Direct Materials', 'Materials and supplies used on the job', 'material'),
    ('Subcontract', 'Third-party subcontractor costs', 'subcontract'),
    ('Equipment/Rental', 'Equipment usage and rental costs', 'equipment'),
    ('Overhead', 'Indirect costs and overhead allocation', 'overhead');

-- Insert sub-codes for Direct Labor (category 1)
INSERT INTO cost_codes (category_id, code, name, description) VALUES
    ((SELECT id FROM cost_categories WHERE name = 'Direct Labor'), 'DL-001', 'Installation Labor', 'Direct installation work'),
    ((SELECT id FROM cost_categories WHERE name = 'Direct Labor'), 'DL-002', 'Supervision', 'On-site supervision'),
    ((SELECT id FROM cost_categories WHERE name = 'Direct Labor'), 'DL-003', 'Quality Control', 'QC inspection labor'),
    ((SELECT id FROM cost_categories WHERE name = 'Direct Labor'), 'DL-004', 'Travel Time', 'Travel time for workers'),
    ((SELECT id FROM cost_categories WHERE name = 'Direct Labor'), 'DL-005', 'Overtime', 'Overtime premium costs');

-- Insert sub-codes for Direct Materials (category 2)
INSERT INTO cost_codes (category_id, code, name, description) VALUES
    ((SELECT id FROM cost_categories WHERE name = 'Direct Materials'), 'DM-001', 'Raw Materials', 'Basic raw materials'),
    ((SELECT id FROM cost_categories WHERE name = 'Direct Materials'), 'DM-002', 'Consumables', 'Consumable supplies'),
    ((SELECT id FROM cost_categories WHERE name = 'Direct Materials'), 'DM-003', 'Permits', 'Permits and fees'),
    ((SELECT id FROM cost_categories WHERE name = 'Direct Materials'), 'DM-004', 'Shipping', 'Delivery and shipping'),
    ((SELECT id FROM cost_categories WHERE name = 'Direct Materials'), 'DM-005', 'Hardware', 'Fasteners and hardware');

-- Insert sub-codes for Subcontract (category 3)
INSERT INTO cost_codes (category_id, code, name, description) VALUES
    ((SELECT id FROM cost_categories WHERE name = 'Subcontract'), 'SC-001', 'Electrical', 'Electrical subcontractor'),
    ((SELECT id FROM cost_categories WHERE name = 'Subcontract'), 'SC-002', 'Plumbing', 'Plumbing subcontractor'),
    ((SELECT id FROM cost_categories WHERE name = 'Subcontract'), 'SC-003', 'HVAC', 'HVAC subcontractor'),
    ((SELECT id FROM cost_categories WHERE name = 'Subcontract'), 'SC-004', 'Specialty', 'Specialty trades'),
    ((SELECT id FROM cost_categories WHERE name = 'Subcontract'), 'SC-005', 'Consulting', 'Consulting services');

-- Insert sub-codes for Equipment/Rental (category 4)
INSERT INTO cost_codes (category_id, code, name, description) VALUES
    ((SELECT id FROM cost_categories WHERE name = 'Equipment/Rental'), 'EQ-001', 'Heavy Equipment', 'Excavators, cranes, etc.'),
    ((SELECT id FROM cost_categories WHERE name = 'Equipment/Rental'), 'EQ-002', 'Tools', 'Power tools and equipment'),
    ((SELECT id FROM cost_categories WHERE name = 'Equipment/Rental'), 'EQ-003', 'Vehicles', 'Vehicles and transportation'),
    ((SELECT id FROM cost_categories WHERE name = 'Equipment/Rental'), 'EQ-004', 'Scaffolding', 'Scaffolding and access'),
    ((SELECT id FROM cost_categories WHERE name = 'Equipment/Rental'), 'EQ-005', 'Generators', 'Power generators');

-- Insert sub-codes for Overhead (category 5)
INSERT INTO cost_codes (category_id, code, name, description) VALUES
    ((SELECT id FROM cost_categories WHERE name = 'Overhead'), 'OH-001', 'Insurance', 'Job-specific insurance'),
    ((SELECT id FROM cost_categories WHERE name = 'Overhead'), 'OH-002', 'Bonding', 'Bonding premiums'),
    ((SELECT id FROM cost_categories WHERE name = 'Overhead'), 'OH-003', 'Administration', 'Administrative overhead'),
    ((SELECT id FROM cost_categories WHERE name = 'Overhead'), 'OH-004', 'Site Office', 'Temporary site office'),
    ((SELECT id FROM cost_categories WHERE name = 'Overhead'), 'OH-005', 'Cleanup', 'Site cleanup and disposal');