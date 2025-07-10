// Script to export database data for GitHub repository
import { db } from '../server/db.js';
import fs from 'fs';

async function exportDatabaseData() {
  console.log('🔄 Exporting database data...');
  
  try {
    // Export all tables with data
    const tables = [
      'users', 'tenants', 'business_profiles', 'shifts', 'opportunities',
      'swap_requests', 'assignments', 'time_entries', 'staff_strikes',
      'holiday_requests', 'job_roles', 'departments', 'locations',
      'operating_hours', 'shift_policies', 'schedule_templates',
      'holiday_entitlements', 'subscriptions', 'site_admins'
    ];
    
    let exportData = {
      timestamp: new Date().toISOString(),
      description: 'ShiftFlo Database Export',
      tables: {}
    };
    
    for (const tableName of tables) {
      console.log(`📋 Exporting ${tableName}...`);
      
      // Get table data
      const result = await db.execute(`SELECT * FROM ${tableName}`);
      exportData.tables[tableName] = {
        count: result.rows.length,
        data: result.rows
      };
      
      console.log(`✅ ${tableName}: ${result.rows.length} records`);
    }
    
    // Write to file
    const exportFile = 'database-export.json';
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log('✅ Database export complete!');
    console.log(`📄 Export file: ${exportFile}`);
    
    // Create SQL insert script
    let sqlScript = '-- ShiftFlo Database Export\n';
    sqlScript += `-- Generated: ${new Date().toISOString()}\n\n`;
    
    for (const [tableName, tableData] of Object.entries(exportData.tables)) {
      if (tableData.data.length > 0) {
        sqlScript += `-- ${tableName.toUpperCase()} (${tableData.count} records)\n`;
        
        // Get column names from first row
        const columns = Object.keys(tableData.data[0]);
        
        for (const row of tableData.data) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
            return value;
          });
          
          sqlScript += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        
        sqlScript += '\n';
      }
    }
    
    fs.writeFileSync('database-export.sql', sqlScript);
    console.log('✅ SQL export complete!');
    console.log('📄 SQL file: database-export.sql');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

exportDatabaseData();