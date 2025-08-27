import sqlite3 from 'sqlite3';

async function checkBiometricRequests() {
  console.log('🔍 Checking biometric requests...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        br.id,
        br.userId,
        br.requestType,
        br.reason,
        br.accessLevel,
        br.status,
        br.createdAt,
        u.firstName,
        u.lastName,
        u.unitNumber
      FROM biometric_requests br
      LEFT JOIN users u ON br.userId = u.id
      ORDER BY br.createdAt DESC
    `, (err, rows) => {
      if (err) {
        console.error('❌ Error querying biometric requests:', err);
        reject(err);
        return;
      }
      
      console.log(`\n📊 Found ${rows.length} biometric requests:`);
      
      if (rows.length === 0) {
        console.log('No biometric requests found');
      } else {
        rows.forEach((row, index) => {
          console.log(`\n${index + 1}. Request ID: ${row.id}`);
          console.log(`   User: ${row.firstName} ${row.lastName} (${row.unitNumber})`);
          console.log(`   Type: ${row.requestType}`);
          console.log(`   Reason: ${row.reason}`);
          console.log(`   Access Level: ${row.accessLevel}`);
          console.log(`   Status: ${row.status}`);
          console.log(`   Created: ${row.createdAt}`);
        });
      }
      
      // Count by status
      const statusCounts = rows.reduce((acc: any, row: any) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Status Summary:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      db.close();
      resolve(rows);
    });
  });
}

checkBiometricRequests().then(() => {
  console.log('\n🎉 Biometric requests check complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Biometric requests check failed:', error);
  process.exit(1);
});
