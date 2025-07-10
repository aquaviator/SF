import { db } from '../server/db';
import { 
  users, shifts, timeEntries, holidayRequests, swapRequests, staffStrikes,
  businessProfiles, jobRoles, locations, shiftPolicies
} from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

async function runSanityChecks() {
  console.log('🔍 RUNNING SANITY CHECKS');
  let passed = 0;
  let failed = 0;

  try {
    // 1. Referential Integrity Checks
    console.log('\n📋 Checking referential integrity...');
    
    // Check users.tenantId references business_profiles.tenantId
    const orphanedUsers = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM users u 
      LEFT JOIN business_profiles bp ON u.tenant_id = bp.tenant_id 
      WHERE bp.tenant_id IS NULL
    `);
    
    if (orphanedUsers.rows[0].count > 0) {
      console.error(`❌ Found ${orphanedUsers.rows[0].count} users without valid tenant references`);
      failed++;
    } else {
      console.log('✅ All users have valid tenant references');
      passed++;
    }

    // Check shifts.assignedTo references users.id
    const orphanedShifts = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM shifts s 
      LEFT JOIN users u ON s.assigned_to = u.id 
      WHERE s.assigned_to IS NOT NULL AND u.id IS NULL
    `);
    
    if (orphanedShifts.rows[0].count > 0) {
      console.error(`❌ Found ${orphanedShifts.rows[0].count} shifts with invalid user assignments`);
      failed++;
    } else {
      console.log('✅ All assigned shifts reference valid users');
      passed++;
    }

    // Check time_entries.userId and shiftId references
    const orphanedTimeEntries = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM time_entries te 
      LEFT JOIN users u ON te.user_id = u.id 
      LEFT JOIN shifts s ON te.shift_id = s.id 
      WHERE u.id IS NULL OR s.id IS NULL
    `);
    
    if (orphanedTimeEntries.rows[0].count > 0) {
      console.error(`❌ Found ${orphanedTimeEntries.rows[0].count} time entries with invalid references`);
      failed++;
    } else {
      console.log('✅ All time entries have valid user and shift references');
      passed++;
    }

    // Check staff_strikes.userId references
    const orphanedStrikes = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM staff_strikes ss 
      LEFT JOIN users u ON ss.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (orphanedStrikes.rows[0].count > 0) {
      console.error(`❌ Found ${orphanedStrikes.rows[0].count} strikes with invalid user references`);
      failed++;
    } else {
      console.log('✅ All strikes reference valid users');
      passed++;
    }

    // 2. Spot Check: Random time entry validation
    console.log('\n🎯 Performing spot checks...');
    
    const randomTimeEntry = await db.execute(sql`
      SELECT te.*, u.first_name, u.last_name, s.date, s.start_time, s.end_time
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      JOIN shifts s ON te.shift_id = s.id
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (randomTimeEntry.rows.length === 0) {
      console.log('⚠️ No time entries found for spot check');
    } else {
      const entry = randomTimeEntry.rows[0];
      console.log(`✅ Spot check passed: Time entry ${entry.id} for ${entry.first_name} ${entry.last_name} on ${entry.date}`);
      passed++;
    }

    // 3. API Smoke Tests
    console.log('\n🌐 Running API smoke tests...');
    
    // Test basic endpoints
    const endpoints = [
      { path: '/api/shifts?tenantId=acme-corp', name: 'Shifts API' },
      { path: '/api/users?tenantId=acme-corp', name: 'Users API' },
      { path: '/api/business-profile?tenantId=acme-corp', name: 'Business Profile API' },
      { path: '/api/time-entries?tenantId=acme-corp', name: 'Time Entries API' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint.path}`);
        
        if (!response.ok) {
          console.error(`❌ ${endpoint.name} returned ${response.status}: ${response.statusText}`);
          failed++;
          continue;
        }

        const data = await response.json();
        
        if (Array.isArray(data) && data.length === 0) {
          console.log(`⚠️ ${endpoint.name} returned empty array (may be expected)`);
        } else if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ ${endpoint.name} returned ${data.length} records`);
          passed++;
        } else if (typeof data === 'object' && data !== null) {
          console.log(`✅ ${endpoint.name} returned valid object`);
          passed++;
        } else {
          console.error(`❌ ${endpoint.name} returned unexpected data type`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ ${endpoint.name} failed: ${error.message}`);
        failed++;
      }
    }

    // 4. Data Consistency Checks
    console.log('\n🔄 Checking data consistency...');
    
    // Check that all tenants have required base data
    const tenants = await db.execute(sql`SELECT DISTINCT tenant_id FROM users`);
    
    for (const tenant of tenants.rows) {
      const tenantId = tenant.tenant_id;
      
      // Check business profile exists
      const businessProfile = await db.select().from(businessProfiles).where(eq(businessProfiles.tenantId, tenantId));
      if (businessProfile.length === 0) {
        console.error(`❌ Tenant ${tenantId} missing business profile`);
        failed++;
      } else {
        console.log(`✅ Tenant ${tenantId} has business profile`);
        passed++;
      }

      // Check shift policy exists
      const policy = await db.select().from(shiftPolicies).where(eq(shiftPolicies.tenantId, tenantId));
      if (policy.length === 0) {
        console.error(`❌ Tenant ${tenantId} missing shift policy`);
        failed++;
      } else {
        console.log(`✅ Tenant ${tenantId} has shift policy`);
        passed++;
      }
    }

    // Summary
    console.log('\n📊 SANITY CHECK SUMMARY');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

    if (failed > 0) {
      console.error('\n💥 SANITY CHECKS FAILED - Database integrity issues detected');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL SANITY CHECKS PASSED - Database is healthy');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ SANITY CHECK ERROR:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSanityChecks();
}

export { runSanityChecks };