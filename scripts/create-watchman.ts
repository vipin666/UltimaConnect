import sqlite3 from 'sqlite3';

async function createWatchman() {
  console.log('👮 Creating watchman account...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if watchman already exists
      db.get("SELECT id FROM users WHERE username = 'watchman'", async (err, row) => {
        if (err) {
          console.error('❌ Error checking watchman:', err);
          reject(err);
          return;
        }
        
        if (row) {
          console.log('✅ Watchman already exists');
          db.close();
          resolve(true);
          return;
        }
        
        // Create watchman password hash (simple hash for demo)
        const password = 'watchman123';
        const hashedPassword = '$2b$10$' + Buffer.from(password).toString('base64');
        
        // Insert watchman user
        db.run(`INSERT INTO users (id, username, password, firstName, lastName, email, unitNumber, role, status, isOwner) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['watchman-001', 'watchman', hashedPassword, 'Security', 'Guard', 'watchman@towerconnect.local', 'Security', 'watchman', 'active', false],
          (err) => {
            if (err) {
              console.error('❌ Error creating watchman:', err);
              reject(err);
            } else {
              console.log('✅ Watchman created successfully!');
              console.log('Username: watchman');
              console.log('Password: watchman123');
              console.log('Role: watchman');
            }
            
            db.close();
            resolve(true);
          }
        );
      });
    });
  });
}

createWatchman().then(() => {
  console.log('🎉 Watchman creation complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Watchman creation failed:', error);
  process.exit(1);
});
