import sqlite3 from 'sqlite3';

const dbPath = './tower-connect.db';
const db = new sqlite3.Database(dbPath);

console.log('Adding adminComment field to posts table...');

db.run(`
  ALTER TABLE posts ADD COLUMN admin_comment TEXT
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ adminComment field already exists');
    } else {
      console.error('Error adding adminComment field:', err);
    }
  } else {
    console.log('✅ adminComment field added successfully');
  }
  
  db.close();
});
