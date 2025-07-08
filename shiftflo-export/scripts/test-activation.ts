// Test the activation flow with the existing token
async function testActivation() {
  const existingToken = '8b2eb960748ac64d33849386f9cbe84aeba50c9b4faac42249ffc6bffd3ca8d8';
  
  console.log('🧪 ACTIVATION_TEST_START', { 
    token: existingToken,
    timestamp: new Date().toISOString() 
  });
  
  // Test 1: Verify token validation
  try {
    console.log('📤 Testing token validation...');
    const validateResponse = await fetch(`http://localhost:5000/api/auth/verify-token?token=${existingToken}`);
    const validateData = await validateResponse.json();
    
    if (validateResponse.ok) {
      console.log('✅ TOKEN_VALIDATION_SUCCESS', {
        user: validateData.user,
        status: validateResponse.status
      });
    } else {
      console.log('❌ TOKEN_VALIDATION_FAILED', {
        message: validateData.message,
        status: validateResponse.status
      });
      return;
    }
  } catch (error) {
    console.error('❌ TOKEN_VALIDATION_ERROR', { error: error.message });
    return;
  }
  
  // Test 2: Complete activation
  try {
    console.log('📤 Testing account activation...');
    const activationResponse = await fetch('http://localhost:5000/api/auth/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: existingToken,
        password: 'TestPassword123!'
      }),
    });
    
    const activationData = await activationResponse.json();
    
    if (activationResponse.ok) {
      console.log('✅ ACTIVATION_SUCCESS', {
        message: activationData.message,
        status: activationResponse.status
      });
    } else {
      console.log('❌ ACTIVATION_FAILED', {
        message: activationData.message,
        status: activationResponse.status
      });
    }
  } catch (error) {
    console.error('❌ ACTIVATION_ERROR', { error: error.message });
  }
}

testActivation();