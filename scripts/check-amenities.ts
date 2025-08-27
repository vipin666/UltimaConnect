import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function checkAmenities() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('Checking amenities...\n');
  
  db.all('SELECT * FROM amenities', (err, rows) => {
    if (err) {
      console.error('Error querying amenities:', err);
    } else {
      console.log('Amenities found:');
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Type: ${row.type}`);
        console.log(`   Description: ${row.description}`);
        console.log(`   Status: ${row.status}`);
        console.log('');
      });
    }
    db.close();
  });
}

checkAmenities().catch(console.error);
