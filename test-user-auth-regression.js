// Test regular user authentication to ensure no regression from admin session fixes
import fetch from 'node-fetch';

async function testUserAuth() {
  console.log('🧪 TESTING_USER_AUTH_REGRESSION');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test 1: Regular user login (business user)
    console.log('🔐 Testing regular user login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'leatfield@gmail.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    
    console.log('✅ USER_LOGIN_RESPONSE:', {
      status: loginResponse.status,
      success: loginData.success,
      setCookieHeader: setCookieHeader ? 'Present' : 'Missing',
      userId: loginData.user?.id,
      tenantId: loginData.user?.tenantId
    });
    
    if (!setCookieHeader) {
      console.log('❌ NO_USER_SESSION_COOKIE');
      return;
    }
    
    // Extract session cookie
    const sessionCookie = setCookieHeader.split(';')[0];
    console.log('📝 USER_SESSION_COOKIE:', sessionCookie);
    
    // Test 2: User auth check
    const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    const authData = await authResponse.json();
    
    console.log('✅ USER_AUTH_CHECK_RESPONSE:', {
      status: authResponse.status,
      success: authData.user ? true : false,
      userId: authData.user?.id,
      tenantId: authData.user?.tenantId,
      role: authData.user?.role
    });
    
    if (authResponse.status === 200) {
      console.log('✅ USER_AUTH_SYSTEM_WORKING');
    } else {
      console.log('❌ USER_AUTH_SYSTEM_FAILED');
    }
    
  } catch (error) {
    console.error('❌ USER_AUTH_TEST_ERROR:', error.message);
  }
}

async function testAdminAuth() {
  console.log('🧪 TESTING_ADMIN_AUTH_REGRESSION');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test admin login
    console.log('🔐 Testing admin login...');
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
      setCookieHeader: setCookieHeader ? 'Present' : 'Missing',
      adminId: loginData.admin?.id
    });
    
    if (!setCookieHeader) {
      console.log('❌ NO_ADMIN_SESSION_COOKIE');
      return;
    }
    
    // Extract session cookie
    const sessionCookie = setCookieHeader.split(';')[0];
    
    // Test admin auth check
    const authResponse = await fetch(`${baseUrl}/api/admin/me`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    const authData = await authResponse.json();
    
    console.log('✅ ADMIN_AUTH_CHECK_RESPONSE:', {
      status: authResponse.status,
      success: authData.admin ? true : false,
      adminId: authData.admin?.id
    });
    
    if (authResponse.status === 200) {
      console.log('✅ ADMIN_AUTH_SYSTEM_WORKING');
    } else {
      console.log('❌ ADMIN_AUTH_SYSTEM_FAILED');
    }
    
  } catch (error) {
    console.error('❌ ADMIN_AUTH_TEST_ERROR:', error.message);
  }
}

async function runRegressionTests() {
  console.log('🚀 AUTHENTICATION_REGRESSION_TEST_START');
  
  await testUserAuth();
  console.log(''); // spacer
  await testAdminAuth();
  
  console.log('🏁 AUTHENTICATION_REGRESSION_TEST_COMPLETE');
}

runRegressionTests();