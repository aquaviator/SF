// Test admin password verification
import bcrypt from 'bcrypt';

async function testAdminPassword() {
  console.log('🧪 TESTING_ADMIN_PASSWORD_VERIFICATION');
  
  const storedHash = '$2b$10$XcNLmu/vJnIFppYNS16XS.1m10HmwPf/LuV8/OhZxmAeF4I1yADpu';
  const testPassword = 'password123';
  
  try {
    const isValid = await bcrypt.compare(testPassword, storedHash);
    console.log('✅ PASSWORD_VERIFICATION_RESULT:', {
      password: testPassword,
      isValid: isValid
    });
    
    if (!isValid) {
      console.log('🔑 GENERATING_NEW_HASH...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('✅ NEW_HASH_GENERATED:', newHash);
    }
    
  } catch (error) {
    console.error('❌ PASSWORD_TEST_ERROR:', error.message);
  }
}

testAdminPassword();