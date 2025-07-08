-- ShiftFlo Database Export for GitHub Deployment
-- Generated: 2025-07-08T20:00:02.357Z
-- Version: 1.0.0

-- Disable foreign key checks for import
SET session_replication_role = replica;


-- USERS - User accounts (owner and staff)
-- Sample records: 5

-- Users table with sample data
INSERT INTO users (id, username, email, password, first_name, last_name, role, tenant_id, is_active, created_at) VALUES
(1, 'owner@test.com', 'owner@test.com', '$2b$10$hash', 'Business', 'Owner', 'owner', 'test-tenant', true, NOW()),
(2, 'staff1@test.com', 'staff1@test.com', '$2b$10$hash', 'John', 'Staff', 'staff', 'test-tenant', true, NOW()),
(3, 'staff2@test.com', 'staff2@test.com', '$2b$10$hash', 'Jane', 'Staff', 'staff', 'test-tenant', true, NOW());

-- TENANTS - Tenant organizations
-- Sample records: 1

-- Tenants table
INSERT INTO tenants (id, name, subdomain, is_active, created_at) VALUES
('test-tenant', 'Test Company', 'test-company', true, NOW());

-- BUSINESS_PROFILES - Business profile information
-- Sample records: 1

-- Business profiles
INSERT INTO business_profiles (id, tenant_id, business_name, industry, phone, email, address, created_at) VALUES
(1, 'test-tenant', 'Test Company', 'Technology', '+1234567890', 'info@test.com', '123 Main St', NOW());

-- SITE_ADMINS - Site admin accounts
-- Sample records: 1

-- Site admins
INSERT INTO site_admins (id, username, email, password, role, is_active, is_2fa_enabled, created_at) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$SDWt2NWbUYdyx/uZsLkJQuexVaTJjjRGO8/JgwA86cMQmf9eU689O', 'super_admin', true, true, NOW());

-- JOB_ROLES - Job roles within organizations
-- Sample records: 3

-- Job roles
INSERT INTO job_roles (id, tenant_id, title, description, created_at) VALUES
(1, 'test-tenant', 'Manager', 'Management role', NOW()),
(2, 'test-tenant', 'Team Member', 'Regular team member', NOW()),
(3, 'test-tenant', 'Supervisor', 'Supervisory role', NOW());

-- LOCATIONS - Business locations
-- Sample records: 1

-- Locations
INSERT INTO locations (id, tenant_id, name, address, created_at) VALUES
(1, 'test-tenant', 'Main Office', '123 Main St, City, State', NOW());

-- SHIFT_POLICIES - Shift management policies
-- Sample records: 1

-- Shift policies
INSERT INTO shift_policies (id, tenant_id, min_notice_hours, max_advance_booking_days, created_at) VALUES
(1, 'test-tenant', 24, 30, NOW());

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Update sequences to prevent conflicts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('business_profiles_id_seq', (SELECT MAX(id) FROM business_profiles));
SELECT setval('site_admins_id_seq', (SELECT MAX(id) FROM site_admins));
SELECT setval('job_roles_id_seq', (SELECT MAX(id) FROM job_roles));
SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations));
SELECT setval('shift_policies_id_seq', (SELECT MAX(id) FROM shift_policies));
