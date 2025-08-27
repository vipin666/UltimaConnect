import sqlite3 from 'sqlite3';

const dbPath = './tower-connect.db';
const db = new sqlite3.Database(dbPath);

console.log('Adding arrivalTime and departureTime fields to visitors table...');

// Add arrivalTime field
db.run(`
  ALTER TABLE visitors ADD COLUMN arrivalTime DATETIME
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ arrivalTime field already exists');
    } else {
      console.error('Error adding arrivalTime field:', err);
    }
  } else {
    console.log('✅ arrivalTime field added successfully');
  }
});

// Add departureTime field
db.run(`
  ALTER TABLE visitors ADD COLUMN departureTime DATETIME
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ departureTime field already exists');
    } else {
      console.error('Error adding departureTime field:', err);
    }
  } else {
    console.log('✅ departureTime field added successfully');
  }
  
  db.close();
});
