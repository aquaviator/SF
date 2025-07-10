import { execSync } from 'child_process';

/**
 * Test script to validate business registration system
 * Tests both success and error scenarios
 */

const BASE_URL = 'http://localhost:5000';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
}

async function testAPI(testName: string, url: string, data: any, expectedStatus: number): Promise<TestResult> {
  try {
    const command = `curl -s -w "\\n%{http_code}" -X POST "${url}" -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    const output = execSync(command, { encoding: 'utf-8' });
    const lines = output.trim().split('\n');
    const statusCode = parseInt(lines[lines.length - 1]);
    const responseBody = lines.slice(0, -1).join('\n');
    
    console.log(`\n=== ${testName} ===`);
    console.log(`Status: ${statusCode} (expected: ${expectedStatus})`);
    console.log(`Response: ${responseBody}`);
    
    if (statusCode === expectedStatus) {
      try {
        const jsonResponse = JSON.parse(responseBody);
        return {
          name: testName,
          success: true,
          message: `✅ Test passed: ${jsonResponse.message || 'Success'}`
        };
      } catch {
        return {
          name: testName,
          success: statusCode === expectedStatus,
          message: statusCode === expectedStatus ? '✅ Test passed' : '❌ Test failed'
        };
      }
    } else {
      return {
        name: testName,
        success: false,
        message: `❌ Expected status ${expectedStatus}, got ${statusCode}`
      };
    }
  } catch (error: any) {
    return {
      name: testName,
      success: false,
      message: `❌ Test failed: ${error.message}`
    };
  }
}

async function runTests() {
  console.log('🧪 Starting Business Registration System Tests\n');
  
  const tests: TestResult[] = [];
  
  // Test 1: Subdomain availability check
  try {
    const subdomainCheck = execSync(`curl -s "${BASE_URL}/api/check-subdomain/test-new-subdomain"`, { encoding: 'utf-8' });
    const subdomainResult = JSON.parse(subdomainCheck);
    console.log('=== Subdomain Check ===');
    console.log(`Available: ${subdomainResult.available}`);
    tests.push({
      name: 'Subdomain Check',
      success: subdomainResult.available === true,
      message: subdomainResult.available ? '✅ Subdomain check working' : '❌ Subdomain check failed'
    });
  } catch (error: any) {
    tests.push({
      name: 'Subdomain Check',
      success: false,
      message: `❌ Subdomain check failed: ${error.message}`
    });
  }
  
  // Test 2: Duplicate email registration (should fail with 400)
  const duplicateEmailTest = await testAPI(
    'Duplicate Email Registration',
    `${BASE_URL}/api/register-business`,
    {
      business: {
        name: "Test Duplicate Business",
        subdomain: "test-duplicate-business",
        businessType: "Technology",
        phone: "+1234567890",
        website: "https://test.com",
        staffCount: 5
      },
      owner: {
        firstName: "Test",
        lastName: "User",
        email: "leatfield@gmail.com", // This email already exists
        password: "TestPass123!",
        confirmPassword: "TestPass123!"
      }
    },
    400 // Expecting 400 error for duplicate email
  );
  tests.push(duplicateEmailTest);
  
  // Test 3: New business registration (should succeed with 200)
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const newBusinessTest = await testAPI(
    'New Business Registration',
    `${BASE_URL}/api/register-business`,
    {
      business: {
        name: "Test New Business",
        subdomain: `test-new-${Date.now()}`,
        businessType: "Healthcare",
        phone: "+1234567890",
        website: "https://newbusiness.com",
        staffCount: 10
      },
      owner: {
        firstName: "New",
        lastName: "Owner",
        email: uniqueEmail,
        password: "TestPass123!",
        confirmPassword: "TestPass123!"
      }
    },
    200 // Expecting 200 success
  );
  tests.push(newBusinessTest);
  
  // Test 4: Missing required fields (should fail with 400)
  const missingFieldsTest = await testAPI(
    'Missing Required Fields',
    `${BASE_URL}/api/register-business`,
    {
      business: {
        name: "Incomplete Business"
        // Missing subdomain, businessType, etc.
      },
      owner: {
        firstName: "Test"
        // Missing lastName, email, etc.
      }
    },
    400 // Expecting 400 error for missing fields
  );
  tests.push(missingFieldsTest);
  
  // Print test summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  tests.forEach(test => {
    console.log(`${test.message}`);
  });
  
  const passedTests = tests.filter(t => t.success).length;
  const totalTests = tests.length;
  
  console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Registration system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(console.error);