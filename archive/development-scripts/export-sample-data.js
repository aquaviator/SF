// Export sample data for GitHub repository
import { db } from '../server/db.ts';
import fs from 'fs';
import path from 'path';

async function exportSampleData() {
  console.log('🔄 Exporting sample data for GitHub deployment...');
  
  try {
    // Core application tables to export
    const coreTables = [
      'users', 'tenants', 'business_profiles', 'job_roles', 'departments', 
      'locations', 'operating_hours', 'shift_policies', 'site_admins',
      'subscriptions', 'domain_config'
    ];
    
    // Sample data tables (smaller subset for testing)
    const sampleTables = [
      'shifts', 'time_entries', 'holiday_requests', 'staff_strikes',
      'opportunities', 'swap_requests', 'assignments'
    ];
    
    let exportData = {
      timestamp: new Date().toISOString(),
      description: 'ShiftFlo Sample Data Export for GitHub Deployment',
      version: '1.0.0',
      core_tables: {},
      sample_tables: {}
    };
    
    // Export core tables (full data)
    for (const tableName of coreTables) {
      try {
        console.log(`📋 Exporting core table: ${tableName}...`);
        
        const result = await db.execute(`SELECT * FROM ${tableName} LIMIT 100`);
        exportData.core_tables[tableName] = {
          count: result.rows.length,
          data: result.rows
        };
        
        console.log(`✅ ${tableName}: ${result.rows.length} records`);
      } catch (error) {
        console.log(`⚠️  ${tableName}: Table not found or error - ${error.message}`);
        exportData.core_tables[tableName] = { count: 0, data: [] };
      }
    }
    
    // Export sample tables (limited data)
    for (const tableName of sampleTables) {
      try {
        console.log(`📋 Exporting sample table: ${tableName}...`);
        
        const result = await db.execute(`SELECT * FROM ${tableName} LIMIT 20`);
        exportData.sample_tables[tableName] = {
          count: result.rows.length,
          data: result.rows
        };
        
        console.log(`✅ ${tableName}: ${result.rows.length} records`);
      } catch (error) {
        console.log(`⚠️  ${tableName}: Table not found or error - ${error.message}`);
        exportData.sample_tables[tableName] = { count: 0, data: [] };
      }
    }
    
    // Write JSON export
    const jsonFile = 'database-export.json';
    fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2));
    console.log(`✅ JSON export complete: ${jsonFile}`);
    
    // Create SQL insert script
    let sqlScript = '-- ShiftFlo Database Export for GitHub Deployment\n';
    sqlScript += `-- Generated: ${new Date().toISOString()}\n`;
    sqlScript += `-- Version: 1.0.0\n\n`;
    
    // Add core tables SQL
    sqlScript += '-- CORE TABLES (Essential for application)\n';
    for (const [tableName, tableData] of Object.entries(exportData.core_tables)) {
      if (tableData.data.length > 0) {
        sqlScript += `\n-- ${tableName.toUpperCase()} (${tableData.count} records)\n`;
        sqlScript += generateInsertStatements(tableName, tableData.data);
      }
    }
    
    // Add sample tables SQL
    sqlScript += '\n-- SAMPLE TABLES (Test data)\n';
    for (const [tableName, tableData] of Object.entries(exportData.sample_tables)) {
      if (tableData.data.length > 0) {
        sqlScript += `\n-- ${tableName.toUpperCase()} (${tableData.count} records)\n`;
        sqlScript += generateInsertStatements(tableName, tableData.data);
      }
    }
    
    // Write SQL export
    const sqlFile = 'database-export.sql';
    fs.writeFileSync(sqlFile, sqlScript);
    console.log(`✅ SQL export complete: ${sqlFile}`);
    
    // Create deployment summary
    const summary = {
      export_timestamp: new Date().toISOString(),
      total_core_tables: Object.keys(exportData.core_tables).length,
      total_sample_tables: Object.keys(exportData.sample_tables).length,
      total_records: Object.values(exportData.core_tables).reduce((sum, t) => sum + t.count, 0) +
                     Object.values(exportData.sample_tables).reduce((sum, t) => sum + t.count, 0),
      files_created: [jsonFile, sqlFile],
      deployment_ready: true
    };
    
    fs.writeFileSync('deployment-summary.json', JSON.stringify(summary, null, 2));
    console.log('✅ Deployment summary created: deployment-summary.json');
    
    console.log('\n🎉 Export complete! Files ready for GitHub:');
    console.log(`📄 ${jsonFile} - Full data export`);
    console.log(`📄 ${sqlFile} - SQL import script`);
    console.log(`📄 deployment-summary.json - Deployment info`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

function generateInsertStatements(tableName, data) {
  if (data.length === 0) return '';
  
  let sql = '';
  const columns = Object.keys(data[0]);
  
  for (const row of data) {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      if (value instanceof Date) return `'${value.toISOString()}'`;
      return value;
    });
    
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  }
  
  return sql;
}

// Run export
exportSampleData().catch(console.error);