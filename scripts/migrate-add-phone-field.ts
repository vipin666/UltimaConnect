import sqlite3 from 'sqlite3';

async function migrateAddPhoneField() {
  console.log('🔧 Adding phone field to users table...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Add phone field to users table
      db.run(`
        ALTER TABLE users ADD COLUMN phone VARCHAR(20)
      `, (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('✅ phone field already exists');
          } else {
            console.error('Error adding phone field:', err);
            reject(err);
            return;
          }
        } else {
          console.log('✅ phone field added successfully');
        }
        
        // Update committee members with phone numbers
        const phoneUpdates = [
          { username: 'caretaker', phone: '+91-9876543210' },
          { username: 'secretary', phone: '+91-9876543211' },
          { username: 'president', phone: '+91-9876543212' },
          { username: 'treasurer', phone: '+91-9876543213' }
        ];
        
        let completed = 0;
        let errors = 0;
        
        phoneUpdates.forEach(update => {
          db.run(`
            UPDATE users SET phone = ? WHERE username = ?
          `, [update.phone, update.username], (err) => {
            if (err) {
              console.error(`❌ Error updating phone for ${update.username}:`, err);
              errors++;
            } else {
              console.log(`✅ Updated phone for ${update.username}: ${update.phone}`);
            }
            
            completed++;
            if (completed === phoneUpdates.length) {
              console.log(`\n🎉 Phone field migration completed!`);
              console.log(`✅ Successfully updated: ${completed - errors} users`);
              if (errors > 0) {
                console.log(`❌ Errors: ${errors}`);
              }
              
              db.close();
              resolve(true);
            }
          });
        });
      });
    });
  });
}

migrateAddPhoneField().then(() => {
  console.log('🎉 Phone field migration complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Phone field migration failed:', error);
  process.exit(1);
});
