#!/usr/bin/env tsx

/**
 * Quick test data setup for authentication testing
 * Creates basic test users with known credentials
 */

import { db } from '../server/db';
import { users, businessProfiles } from '../shared/schema';
import bcrypt from 'bcrypt';

async function setupTestUsers() {
  console.log('🚀 Setting up quick test users...');
  
  try {
    // Clear existing users for clean test
    await db.delete(users);
    await db.delete(businessProfiles);
    
    // Hash password for test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create test business profile
    const businessProfile = await db.insert(businessProfiles).values({
      tenantId: 'test-business',
      name: 'Test Business Ltd',
      ownerName: 'Test Owner',
      phone: '+1-555-0000',
      address: '123 Test Street',
      businessType: 'restaurant'
    }).returning();
    
    console.log('✅ Created business profile:', businessProfile[0].name);
    
    // Create test users
    const testUsers = await db.insert(users).values([
      {
        tenantId: 'test-business',
        username: 'owner@test.com',
        password: hashedPassword,
        email: 'owner@test.com',
        role: 'owner',
        firstName: 'Test',
        lastName: 'Owner',
        isActive: true,
        phone: '+1-555-0001'
      },
      {
        tenantId: 'test-business', 
        username: 'staff@test.com',
        password: hashedPassword,
        email: 'staff@test.com',
        role: 'staff',
        firstName: 'Test',
        lastName: 'Staff',
        isActive: true,
        phone: '+1-555-0002'
      }
    ]).returning();
    
    console.log('✅ Created test users:');
    testUsers.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.role}): ${user.email}`);
    });
    
    console.log('\n🔑 Test credentials:');
    console.log('Owner login: owner@test.com / password123');
    console.log('Staff login: staff@test.com / password123');
    console.log('\n🎯 Ready for authentication testing!');
    
  } catch (error) {
    console.error('❌ Error setting up test users:', error);
    throw error;
  }
}

// Run if called directly
setupTestUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { setupTestUsers };