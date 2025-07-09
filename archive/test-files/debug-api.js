// Debug script to check exact API response structure
import http from 'http';

async function makeRequest(path, method = 'GET', data = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: body ? JSON.parse(body) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body,
            headers: res.headers
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

async function debugAPI() {
  // Login
  const loginResult = await makeRequest('/api/admin/login', 'POST', {
    username: 'admin',
    password: 'password123'
  });
  
  const cookie = loginResult.headers['set-cookie']?.[0]?.split(';')[0] || '';
  
  // Get tenants
  const tenantsResult = await makeRequest('/api/admin/tenants', 'GET', null, cookie);
  
  console.log('Raw API Response Fields:');
  if (tenantsResult.data && tenantsResult.data.length > 0) {
    console.log('First tenant fields:', Object.keys(tenantsResult.data[0]));
    console.log('First tenant data:', JSON.stringify(tenantsResult.data[0], null, 2));
  }
}

debugAPI().catch(console.error);