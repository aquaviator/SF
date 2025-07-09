// Test the resend activation email endpoint

const testResendActivation = async () => {
  try {
    console.log('🧪 Testing resend activation email endpoint...');
    
    // Test with a known inactive user (ID 137 - John Doe)
    const response = await fetch('http://localhost:5000/api/resend-activation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 137,
        tenantId: 'ofs-705305'
      }),
    });
    
    const data = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', data);
    
    if (response.ok) {
      console.log('✅ Resend activation email test successful!');
    } else {
      console.error('❌ Resend activation email test failed');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testResendActivation();
