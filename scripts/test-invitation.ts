import { db } from '../server/db';
import { users } from '../shared/schema';
import { nanoid } from 'nanoid';

async function createTestInvitation() {
  try {
    // Create a test staff member with activation token
    const activationToken = nanoid(32);
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // Expires in 7 days

    const testUser = await db.insert(users).values({
      tenantId: 'template-business',
      username: `test-staff-${Date.now()}`,
      password: '', // Empty password until activation
      role: 'staff',
      firstName: 'Test',
      lastName: 'Staff',
      email: 'test.staff@template-business.com',
      isActive: false,
      activationToken,
      tokenExpiresAt,
      activatedAt: null
    }).returning();

    console.log('✅ Test invitation created successfully!');
    console.log('User ID:', testUser[0].id);
    console.log('Activation Token:', activationToken);
    console.log('Token expires at:', tokenExpiresAt);
    console.log('\nTest URLs:');
    console.log(`Verify Token: http://localhost:5000/api/auth/verify-token?token=${activationToken}`);
    console.log(`Frontend Activation: http://localhost:5000/staff/activate/${activationToken}`);

    return {
      user: testUser[0],
      activationToken,
      tokenExpiresAt
    };
  } catch (error) {
    console.error('❌ Error creating test invitation:', error);
    throw error;
  }
}

// Run the script directly
createTestInvitation().then(() => process.exit(0)).catch(() => process.exit(1));

export { createTestInvitation };