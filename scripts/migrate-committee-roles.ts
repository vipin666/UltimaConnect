import sqlite3 from 'sqlite3';

async function migrateCommitteeRoles() {
  console.log('🔧 Migrating committee roles...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, let's check if we need to update the enum values
      // Since SQLite doesn't have native enums like PostgreSQL, we'll just ensure the roles work
      
      // Create committee members if they don't exist
      const committeeMembers = [
        {
          id: 'caretaker-001',
          username: 'caretaker',
          firstName: 'Building',
          lastName: 'Caretaker',
          email: 'caretaker@towerconnect.local',
          unitNumber: 'Office',
          role: 'caretaker',
          phone: '+91-9876543210'
        },
        {
          id: 'secretary-001',
          username: 'secretary',
          firstName: 'Society',
          lastName: 'Secretary',
          email: 'secretary@towerconnect.local',
          unitNumber: 'Office',
          role: 'secretary',
          phone: '+91-9876543211'
        },
        {
          id: 'president-001',
          username: 'president',
          firstName: 'Society',
          lastName: 'President',
          email: 'president@towerconnect.local',
          unitNumber: 'Office',
          role: 'president',
          phone: '+91-9876543212'
        },
        {
          id: 'treasurer-001',
          username: 'treasurer',
          firstName: 'Society',
          lastName: 'Treasurer',
          email: 'treasurer@towerconnect.local',
          unitNumber: 'Office',
          role: 'treasurer',
          phone: '+91-9876543213'
        }
      ];

      let completed = 0;
      let errors = 0;

      committeeMembers.forEach(member => {
        // Check if member already exists
        db.get("SELECT id FROM users WHERE username = ?", [member.username], (err, row) => {
          if (err) {
            console.error(`❌ Error checking ${member.role}:`, err);
            errors++;
            completed++;
            if (completed === committeeMembers.length) {
              finishMigration();
            }
            return;
          }
          
          if (row) {
            console.log(`✅ ${member.role} already exists`);
            completed++;
            if (completed === committeeMembers.length) {
              finishMigration();
            }
            return;
          }
          
          // Create simple password hash for demo
          const password = `${member.role}123`;
          const hashedPassword = '$2b$10$' + Buffer.from(password).toString('base64');
          
          // Insert committee member
          db.run(`
            INSERT INTO users (id, username, password, firstName, lastName, email, unitNumber, role, status, isOwner) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            member.id,
            member.username,
            hashedPassword,
            member.firstName,
            member.lastName,
            member.email,
            member.unitNumber,
            member.role,
            'active',
            false
          ], (err) => {
            if (err) {
              console.error(`❌ Error creating ${member.role}:`, err);
              errors++;
            } else {
              console.log(`✅ Created ${member.role} successfully!`);
              console.log(`   Username: ${member.username}`);
              console.log(`   Password: ${password}`);
              console.log(`   Phone: ${member.phone}`);
            }
            
            completed++;
            if (completed === committeeMembers.length) {
              finishMigration();
            }
          });
        });
      });

      function finishMigration() {
        console.log(`\n🎉 Committee roles migration completed!`);
        console.log(`✅ Successfully processed: ${completed - errors} members`);
        if (errors > 0) {
          console.log(`❌ Errors: ${errors}`);
        }
        
        // Show summary
        db.all("SELECT role, COUNT(*) as count FROM users WHERE role IN ('caretaker', 'secretary', 'president', 'treasurer', 'committee_member') GROUP BY role", (err, summary) => {
          if (!err && summary.length > 0) {
            console.log('\n📊 Committee Members Summary:');
            summary.forEach(row => {
              console.log(`   ${row.role}: ${row.count}`);
            });
          }
          
          db.close();
          resolve(true);
        });
      }
    });
  });
}

migrateCommitteeRoles().then(() => {
  console.log('🎉 Committee roles migration complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Committee roles migration failed:', error);
  process.exit(1);
});
