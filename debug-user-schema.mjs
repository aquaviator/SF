// Debug the user schema and field names

import { pool } from './server/db.js';

const debugUserSchema = async () => {
  try {
    console.log('🔍 Checking user table schema...');
    
    // Get table schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 User table columns:');
    schemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });
    
    // Get a sample inactive user
    const userResult = await pool.query(`
      SELECT id, tenant_id, is_active, email, first_name, last_name
      FROM users
      WHERE tenant_id = 'ofs-705305' AND is_active = false
      LIMIT 1;
    `);
    
    console.log('\n📊 Sample inactive user:');
    console.log(userResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await pool.end();
  }
};

debugUserSchema();
