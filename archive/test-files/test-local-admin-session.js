// Test local admin session to verify session system works
import fetch from 'node-fetch';

async function testLocalAdminSession() {
  console.log('🧪 TESTING_LOCAL_ADMIN_SESSION');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Step 1: Login
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
    
    console.log('✅ LOGIN_RESPONSE:', {
      status: loginResponse.status,
      success: loginData.success,
      setCookieHeader: setCookieHeader ? 'Present' : 'Missing',
      adminId: loginData.admin?.id
    });
    
    if (!setCookieHeader) {
      console.log('❌ NO_SET_COOKIE_HEADER - Session not being set');
      return;
    }
    
    // Extract session cookie
    const sessionCookie = setCookieHeader.split(';')[0];
    console.log('📝 SESSION_COOKIE:', sessionCookie);
    
    // Step 2: Test auth check
    const authResponse = await fetch(`${baseUrl}/api/admin/me`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    const authData = await authResponse.json();
    
    console.log('✅ AUTH_CHECK_RESPONSE:', {
      status: authResponse.status,
      success: authData.admin ? true : false,
      adminId: authData.admin?.id
    });
    
    if (authResponse.status === 200) {
      console.log('✅ SESSION_SYSTEM_WORKING - Admin auth successful');
    } else {
      console.log('❌ SESSION_SYSTEM_FAILED - Admin auth failed');
    }
    
  } catch (error) {
    console.error('❌ TEST_ERROR:', error.message);
  }
}

testLocalAdminSession();