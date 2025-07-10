import { db } from '../server/db';
import { users, siteAdmins, tenants, businessProfiles } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Deployment seed script to ensure proper authentication data exists
async function deploymentSeed() {
  console.log('🌱 DEPLOYMENT_SEED_START', { timestamp: new Date().toISOString() });
  
  try {
    // 1. Ensure site admins exist
    const existingAdmins = await db.select().from(siteAdmins).where(eq(siteAdmins.username, 'admin'));
    
    if (existingAdmins.length === 0) {
      console.log('🔧 CREATING_SITE_ADMIN');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.insert(siteAdmins).values({
        username: 'admin',
        email: 'admin@shiftflo.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        is2faEnabled: false
      });
      console.log('✅ SITE_ADMIN_CREATED');
    } else {
      console.log('✅ SITE_ADMIN_EXISTS');
    }
    
    // 2. Ensure template business tenant exists
    const existingTenant = await db.select().from(tenants).where(eq(tenants.id, 'template-business'));
    
    if (existingTenant.length === 0) {
      console.log('🔧 CREATING_TEMPLATE_TENANT');
      await db.insert(tenants).values({
        id: 'template-business',
        name: 'Template Business',
        subscriptionStatus: 'active',
        subscriptionTier: 'starter',
        maxUsers: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ TEMPLATE_TENANT_CREATED');
    } else {
      console.log('✅ TEMPLATE_TENANT_EXISTS');
    }
    
    // 3. Ensure business profile exists
    const existingProfile = await db.select().from(businessProfiles).where(eq(businessProfiles.tenantId, 'template-business'));
    
    if (existingProfile.length === 0) {
      console.log('🔧 CREATING_BUSINESS_PROFILE');
      await db.insert(businessProfiles).values({
        tenantId: 'template-business',
        businessName: 'Template Business',
        ownerName: 'Business Owner',
        businessType: 'Other',
        phone: '+1234567890',
        email: 'contact@template.com',
        address: '123 Template Street',
        city: 'Template City',
        country: 'Template Country',
        postalCode: '12345',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ BUSINESS_PROFILE_CREATED');
    } else {
      console.log('✅ BUSINESS_PROFILE_EXISTS');
    }
    
    // 4. Ensure business owner user exists
    const existingOwner = await db.select().from(users).where(eq(users.username, 'owner@template.com'));
    
    if (existingOwner.length === 0) {
      console.log('🔧 CREATING_BUSINESS_OWNER');
      const hashedPassword = await bcrypt.hash('password', 10);
      await db.insert(users).values({
        username: 'owner@template.com',
        email: 'owner@template.com',
        password: hashedPassword,
        firstName: 'Business',
        lastName: 'Owner',
        role: 'owner',
        tenantId: 'template-business',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ BUSINESS_OWNER_CREATED');
    } else {
      console.log('✅ BUSINESS_OWNER_EXISTS');
    }
    
    // 5. Ensure staff user exists
    const existingStaff = await db.select().from(users).where(eq(users.username, 'staff@template.com'));
    
    if (existingStaff.length === 0) {
      console.log('🔧 CREATING_STAFF_USER');
      const hashedPassword = await bcrypt.hash('password', 10);
      await db.insert(users).values({
        username: 'staff@template.com',
        email: 'staff@template.com',
        password: hashedPassword,
        firstName: 'Staff',
        lastName: 'Member',
        role: 'staff',
        tenantId: 'template-business',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ STAFF_USER_CREATED');
    } else {
      console.log('✅ STAFF_USER_EXISTS');
    }
    
    console.log('🌱 DEPLOYMENT_SEED_COMPLETE', { timestamp: new Date().toISOString() });
    
  } catch (error) {
    console.error('❌ DEPLOYMENT_SEED_ERROR', { error: error.message, timestamp: new Date().toISOString() });
    throw error;
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploymentSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Deployment seed failed:', error);
      process.exit(1);
    });
}

export { deploymentSeed };