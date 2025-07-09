// Test admin login with 2FA enabled
import fetch from 'node-fetch';

async function testAdmin2FALogin() {
  console.log('🧪 TESTING_ADMIN_2FA_LOGIN');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test admin login with 2FA enabled
    console.log('🔐 Testing admin login with 2FA...');
    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    
    console.log('✅ ADMIN_LOGIN_RESPONSE:', {
      status: loginResponse.status,
      success: loginData.success,
      require2fa: loginData.require2fa,
      setCookieHeader: setCookieHeader ? 'Present' : 'Missing',
      adminId: loginData.admin?.id,
      username: loginData.admin?.username
    });
    
    if (loginResponse.status === 200 && loginData.require2fa) {
      console.log('✅ ADMIN_2FA_LOGIN_WORKING - Successfully requires 2FA');
    } else {
      console.log('❌ ADMIN_2FA_LOGIN_FAILED - Should require 2FA');
    }
    
  } catch (error) {
    console.error('❌ ADMIN_2FA_LOGIN_ERROR:', error.message);
  }
}

testAdmin2FALogin();