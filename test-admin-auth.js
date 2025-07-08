// Test script to diagnose admin authentication issues in deployment
import https from 'https';
import http from 'http';

async function testAdminAuth() {
  console.log('🧪 ADMIN_AUTH_DEPLOYMENT_TEST_START', { timestamp: new Date() });
  
  // Test both preview and deployed domains
  const domains = [
    'localhost:5000',
    'task-master-leatfield.replit.app'
  ];
  
  for (const domain of domains) {
    console.log(`\n🔍 Testing domain: ${domain}`);
    
    try {
      // Test admin login
      const loginData = {
        username: 'admin',
        password: 'password123'
      };
      
      const protocol = domain.includes('localhost') ? http : https;
      const port = domain.includes('localhost') ? 5000 : 443;
      const hostname = domain.replace(':5000', '');
      
      const loginResponse = await makeRequest(protocol, hostname, port, '/api/admin/login', 'POST', loginData);
      
      if (loginResponse.success) {
        console.log('✅ LOGIN_SUCCESS', { domain, adminId: loginResponse.admin.id });
        
        // Test auth check with cookie
        const cookies = loginResponse.cookies;
        const authResponse = await makeRequest(protocol, hostname, port, '/api/admin/me', 'GET', null, cookies);
        
        if (authResponse.admin) {
          console.log('✅ AUTH_CHECK_SUCCESS', { domain, adminId: authResponse.admin.id });
        } else {
          console.log('❌ AUTH_CHECK_FAILED', { domain, error: authResponse.message });
        }
      } else {
        console.log('❌ LOGIN_FAILED', { domain, error: loginResponse.message });
      }
      
    } catch (error) {
      console.error('❌ DOMAIN_TEST_ERROR', { domain, error: error.message });
    }
  }
  
  console.log('\n🧪 ADMIN_AUTH_DEPLOYMENT_TEST_COMPLETE', { timestamp: new Date() });
}

function makeRequest(protocol, hostname, port, path, method, data, cookies) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Admin-Auth-Test/1.0',
        ...(cookies && { 'Cookie': cookies }),
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          // Extract cookies from response
          const cookies = res.headers['set-cookie'];
          parsed.cookies = cookies;
          resolve(parsed);
        } catch (err) {
          resolve({ error: 'Invalid JSON response', raw: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Run the test
testAdminAuth().catch(console.error);