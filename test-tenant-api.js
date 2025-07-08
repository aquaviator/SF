// Test script to verify tenant APIs are working correctly
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

async function testTenantAPIs() {
  console.log('Testing Tenant APIs...\n');

  // 1. Login as admin
  console.log('1. Admin Login...');
  const loginResult = await makeRequest('/api/admin/login', 'POST', {
    username: 'admin',
    password: 'password123'
  });
  
  if (loginResult.statusCode !== 200) {
    console.error('Login failed:', loginResult.statusCode, loginResult.data);
    return;
  }
  
  const cookie = loginResult.headers['set-cookie']?.[0]?.split(';')[0] || '';
  console.log('Login successful');

  // 2. Test tenant list
  console.log('\n2. Testing tenant list...');
  const tenantsResult = await makeRequest('/api/admin/tenants', 'GET', null, cookie);
  
  if (tenantsResult.statusCode !== 200) {
    console.error('Tenant list failed:', tenantsResult.statusCode, tenantsResult.data);
    return;
  }
  
  const dialabeer = tenantsResult.data.find(t => t.subdomain === 'dialabeer');
  if (!dialabeer) {
    console.error('Dial a Beer tenant not found in list');
    return;
  }
  
  console.log('Tenant list working');
  console.log('Dial a Beer in list:', {
    name: dialabeer.name,
    seatsUsed: dialabeer.seatsUsed,
    seatsIncluded: dialabeer.seatsIncluded,
    subscriptionStatus: dialabeer.subscriptionStatus
  });

  // 3. Test tenant details
  console.log('\n3. Testing tenant details...');
  const detailsResult = await makeRequest(`/api/admin/tenants/${dialabeer.id}/details`, 'GET', null, cookie);
  
  if (detailsResult.statusCode !== 200) {
    console.error('Tenant details failed:', detailsResult.statusCode, detailsResult.data);
    return;
  }
  
  console.log('Tenant details working');
  console.log('Dial a Beer details:', {
    tenant: detailsResult.data.tenant,
    revenue: detailsResult.data.revenue,
    totalShifts: detailsResult.data.totalShifts
  });

  console.log('\nAll tenant APIs working correctly!');
}

testTenantAPIs().catch(console.error);