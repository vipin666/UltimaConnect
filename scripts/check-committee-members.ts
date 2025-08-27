import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function checkCommitteeMembers() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('Checking committee members...\n');
  
  db.all('SELECT id, firstName, lastName, role, phone, email, unitNumber FROM users WHERE role IN ("caretaker", "secretary", "president", "treasurer", "committee_member")', (err, rows) => {
    if (err) {
      console.error('Error querying committee members:', err);
    } else {
      console.log('Committee members found:');
      if (rows.length === 0) {
        console.log('No committee members found in database');
      } else {
        rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.firstName} ${row.lastName}`);
          console.log(`   Role: ${row.role}`);
          console.log(`   Phone: ${row.phone || 'Not set'}`);
          console.log(`   Email: ${row.email || 'Not set'}`);
          console.log(`   Unit: ${row.unitNumber || 'Not set'}`);
          console.log('');
        });
      }
    }
    db.close();
  });
}

checkCommitteeMembers().catch(console.error);
