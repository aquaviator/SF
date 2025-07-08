// Test deployment authentication with proper browser simulation
import https from 'https';
import http from 'http';
import { URL } from 'url';

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DeploymentTest/1.0',
        ...options.headers
      }
    };
    
    if (data) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const responseData = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testDeploymentAuth() {
  console.log('🚀 DEPLOYMENT_AUTH_TEST_START');
  
  const baseUrl = 'https://task-master-leatfield.replit.app';
  
  try {
    // Test 1: Login
    console.log('🔐 Testing login...');
    const loginResponse = await makeRequest(`${baseUrl}/api/admin/login`, {
      method: 'POST'
    }, {
      username: 'admin',
      password: 'password123'
    });
    
    console.log('Login Response:', {
      status: loginResponse.statusCode,
      success: loginResponse.data.success,
      setCookie: loginResponse.headers['set-cookie']
    });
    
    // Extract cookie from response
    const setCookieHeader = loginResponse.headers['set-cookie'];
    let sessionCookie = null;
    
    if (setCookieHeader) {
      const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
      const cookieMatch = cookieStr.match(/connect\.sid=([^;]+)/);
      sessionCookie = cookieMatch ? `connect.sid=${cookieMatch[1]}` : null;
    }
    
    console.log('Extracted Cookie:', sessionCookie);
    
    // Test 2: Auth check with cookie
    if (sessionCookie) {
      console.log('✅ Testing auth check with cookie...');
      const authResponse = await makeRequest(`${baseUrl}/api/admin/me`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie
        }
      });
      
      console.log('Auth Check Response:', {
        status: authResponse.statusCode,
        success: authResponse.data.admin ? true : false,
        admin: authResponse.data.admin?.username
      });
    } else {
      console.log('❌ No session cookie found in login response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('🏁 DEPLOYMENT_AUTH_TEST_COMPLETE');
}

testDeploymentAuth();