import sqlite3 from 'sqlite3';

const dbPath = './tower-connect.db';
const db = new sqlite3.Database(dbPath);

console.log('Checking biometric requests in database...');

db.all(`
  SELECT br.*, u.firstName, u.lastName, u.unitNumber, u.role as userRole,
         a.firstName as approverFirstName, a.lastName as approverLastName
  FROM biometric_requests br
  LEFT JOIN users u ON br.userId = u.id
  LEFT JOIN users a ON br.approvedBy = a.id
  ORDER BY br.createdAt DESC
`, (err, rows) => {
  if (err) {
    console.error("Error querying database:", err);
    return;
  }

  console.log(`\nTotal biometric requests: ${rows.length}`);
  
  const pendingRequests = rows.filter((row: any) => row.status === 'pending');
  console.log(`Pending requests: ${pendingRequests.length}`);
  
  const statusCounts = rows.reduce((acc: any, row: any) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nStatus breakdown:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  if (pendingRequests.length > 0) {
    console.log('\nSample pending request:');
    console.log(pendingRequests[0]);
  }

  db.close();
});
