import sqlite3 from 'sqlite3';

const dbPath = './tower-connect.db';
const db = new sqlite3.Database(dbPath);

console.log("Checking users in database...");

// Check for users with flat 104
db.all("SELECT username, firstName, lastName, unitNumber, role, status FROM users WHERE unitNumber LIKE '%104%' OR username LIKE '%104%' OR firstName = 'VIPINDAS'", (err, rows) => {
  if (err) {
    console.error("Error querying database:", err);
    return;
  }
  
  console.log("\nUsers found:");
  rows.forEach((row: any) => {
    console.log(`- Username: ${row.username}, Name: ${row.firstName} ${row.lastName}, Unit: ${row.unitNumber}, Role: ${row.role}, Status: ${row.status}`);
  });
  
  if (rows.length === 0) {
    console.log("No users found with flat 104 or VIPINDAS");
  }
  
  // Close database
  db.close();
});
