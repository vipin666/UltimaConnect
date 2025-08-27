import fetch from 'node-fetch';

async function testBiometricAPI() {
  try {
    console.log('Testing biometric requests API...');
    
    const response = await fetch('http://localhost:3000/api/biometric-requests');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Total biometric requests:', data.length);
    
    const pendingRequests = data.filter((req: any) => req.status === 'pending');
    console.log('Pending requests:', pendingRequests.length);
    
    if (pendingRequests.length > 0) {
      console.log('Sample pending request:', pendingRequests[0]);
    }
    
    const statusCounts = data.reduce((acc: any, req: any) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status breakdown:', statusCounts);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testBiometricAPI();
