import sqlite3 from 'sqlite3';

async function checkTables() {
  console.log('🔍 Checking database tables...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table'
      ORDER BY name
    `, (err, rows) => {
      if (err) {
        console.error('❌ Error querying tables:', err);
        reject(err);
        return;
      }
      
      console.log(`\n📊 Found ${rows.length} tables:`);
      
      if (rows.length === 0) {
        console.log('No tables found');
      } else {
        rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.name}`);
        });
      }
      
      db.close();
      resolve(rows);
    });
  });
}

checkTables().then(() => {
  console.log('\n🎉 Table check complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Table check failed:', error);
  process.exit(1);
});
