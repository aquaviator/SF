// Simple database export for GitHub deployment
import fs from 'fs';

// Sample data structure for deployment
const sampleData = {
  timestamp: new Date().toISOString(),
  description: 'ShiftFlo Sample Data Export for GitHub Deployment',
  version: '1.0.0',
  
  // Essential tables with sample data
  tables: {
    users: {
      description: 'User accounts (owner and staff)',
      sample_count: 5,
      sql: `
-- Users table with sample data
INSERT INTO users (id, username, email, password, first_name, last_name, role, tenant_id, is_active, created_at) VALUES
(1, 'owner@test.com', 'owner@test.com', '$2b$10$hash', 'Business', 'Owner', 'owner', 'test-tenant', true, NOW()),
(2, 'staff1@test.com', 'staff1@test.com', '$2b$10$hash', 'John', 'Staff', 'staff', 'test-tenant', true, NOW()),
(3, 'staff2@test.com', 'staff2@test.com', '$2b$10$hash', 'Jane', 'Staff', 'staff', 'test-tenant', true, NOW());`
    },
    
    tenants: {
      description: 'Tenant organizations',
      sample_count: 1,
      sql: `
-- Tenants table
INSERT INTO tenants (id, name, subdomain, is_active, created_at) VALUES
('test-tenant', 'Test Company', 'test-company', true, NOW());`
    },
    
    business_profiles: {
      description: 'Business profile information',
      sample_count: 1,
      sql: `
-- Business profiles
INSERT INTO business_profiles (id, tenant_id, business_name, industry, phone, email, address, created_at) VALUES
(1, 'test-tenant', 'Test Company', 'Technology', '+1234567890', 'info@test.com', '123 Main St', NOW());`
    },
    
    site_admins: {
      description: 'Site admin accounts',
      sample_count: 1,
      sql: `
-- Site admins
INSERT INTO site_admins (id, username, email, password, role, is_active, is_2fa_enabled, created_at) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$SDWt2NWbUYdyx/uZsLkJQuexVaTJjjRGO8/JgwA86cMQmf9eU689O', 'super_admin', true, true, NOW());`
    },
    
    job_roles: {
      description: 'Job roles within organizations',
      sample_count: 3,
      sql: `
-- Job roles
INSERT INTO job_roles (id, tenant_id, title, description, created_at) VALUES
(1, 'test-tenant', 'Manager', 'Management role', NOW()),
(2, 'test-tenant', 'Team Member', 'Regular team member', NOW()),
(3, 'test-tenant', 'Supervisor', 'Supervisory role', NOW());`
    },
    
    locations: {
      description: 'Business locations',
      sample_count: 1,
      sql: `
-- Locations
INSERT INTO locations (id, tenant_id, name, address, created_at) VALUES
(1, 'test-tenant', 'Main Office', '123 Main St, City, State', NOW());`
    },
    
    shift_policies: {
      description: 'Shift management policies',
      sample_count: 1,
      sql: `
-- Shift policies
INSERT INTO shift_policies (id, tenant_id, min_notice_hours, max_advance_booking_days, created_at) VALUES
(1, 'test-tenant', 24, 30, NOW());`
    }
  }
};

// Generate complete SQL script
let sqlScript = `-- ShiftFlo Database Export for GitHub Deployment
-- Generated: ${sampleData.timestamp}
-- Version: ${sampleData.version}

-- Disable foreign key checks for import
SET session_replication_role = replica;

`;

// Add all table SQL
Object.entries(sampleData.tables).forEach(([tableName, tableInfo]) => {
  sqlScript += `\n-- ${tableName.toUpperCase()} - ${tableInfo.description}\n`;
  sqlScript += `-- Sample records: ${tableInfo.sample_count}\n`;
  sqlScript += tableInfo.sql;
  sqlScript += '\n';
});

sqlScript += `
-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Update sequences to prevent conflicts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('business_profiles_id_seq', (SELECT MAX(id) FROM business_profiles));
SELECT setval('site_admins_id_seq', (SELECT MAX(id) FROM site_admins));
SELECT setval('job_roles_id_seq', (SELECT MAX(id) FROM job_roles));
SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations));
SELECT setval('shift_policies_id_seq', (SELECT MAX(id) FROM shift_policies));
`;

// Write files
fs.writeFileSync('database-export.json', JSON.stringify(sampleData, null, 2));
fs.writeFileSync('database-export.sql', sqlScript);

// Create deployment summary
const deploymentSummary = {
  export_timestamp: sampleData.timestamp,
  total_tables: Object.keys(sampleData.tables).length,
  total_sample_records: Object.values(sampleData.tables).reduce((sum, table) => sum + table.sample_count, 0),
  files_created: ['database-export.json', 'database-export.sql'],
  deployment_ready: true,
  instructions: 'Run database-export.sql on your PostgreSQL database to import sample data'
};

fs.writeFileSync('deployment-summary.json', JSON.stringify(deploymentSummary, null, 2));

console.log('✅ Database export complete!');
console.log('📄 Files created:');
console.log('  - database-export.json (structured data)');
console.log('  - database-export.sql (SQL import script)');
console.log('  - deployment-summary.json (deployment info)');
console.log(`📊 Total tables: ${deploymentSummary.total_tables}`);
console.log(`📊 Total sample records: ${deploymentSummary.total_sample_records}`);
console.log('🚀 Ready for GitHub deployment!');