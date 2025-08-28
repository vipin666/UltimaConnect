import fetch from 'node-fetch';

async function testPasswordResetAPI() {
  console.log('Testing password reset API endpoint...');

  try {
    // First, let's test the endpoint directly
    const testUserId = 'user-123'; // We'll get a real user ID
    const newPassword = 'TestPassword123';
    
    console.log(`Testing PATCH /api/users/${testUserId}/password`);
    console.log(`New password: ${newPassword}`);

    const response = await fetch(`http://localhost:3001/api/users/${testUserId}/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPassword }),
    });

    console.log(`Response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`Response body: ${responseText}`);

  } catch (error) {
    console.error('API test failed:', error);
  }
}

testPasswordResetAPI().catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
