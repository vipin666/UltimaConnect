import sqlite3 from 'sqlite3';

async function seedBiometricData() {
  console.log('🌱 Seeding biometric data for all residents...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Get all residents (excluding admin users)
      db.all("SELECT id, firstName, lastName, unitNumber, role FROM users WHERE role = 'resident'", (err, residents) => {
        if (err) {
          console.error('❌ Error fetching residents:', err);
          reject(err);
          return;
        }

        console.log(`📋 Found ${residents.length} residents to seed biometric data for`);

        if (residents.length === 0) {
          console.log('⚠️ No residents found. Please ensure residents are created first.');
          db.close();
          resolve(true);
          return;
        }

        let completed = 0;
        let errors = 0;

        residents.forEach((resident) => {
          // Create biometric request for each resident
          const biometricId = `biometric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Determine request type based on resident role/status
          const requestTypes = ['fingerprint', 'facial', 'card'];
          const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
          
          // Determine access level
          const accessLevels = ['basic', 'full'];
          const accessLevel = accessLevels[Math.floor(Math.random() * accessLevels.length)];
          
          // Determine status (mostly approved, some pending)
          const statuses = ['approved', 'approved', 'approved', 'pending']; // 75% approved, 25% pending
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          // Set approval details if approved
          const approvedBy = status === 'approved' ? 'admin-001' : null;
          const approvedDate = status === 'approved' ? new Date().toISOString() : null;
          
          // Set expiry date (1 year from now for approved requests)
          const expiryDate = status === 'approved' ? 
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;

          const reason = `Biometric access request for ${resident.firstName} ${resident.lastName} (Unit ${resident.unitNumber})`;
          const adminNotes = status === 'approved' ? 
            `Approved biometric access for resident in Unit ${resident.unitNumber}` : 
            'Pending admin review';

          db.run(`
            INSERT OR IGNORE INTO biometric_requests (
              id, userId, requestType, reason, accessLevel, status, 
              approvedBy, adminNotes, requestDate, approvedDate, expiryDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            biometricId,
            resident.id,
            requestType,
            reason,
            accessLevel,
            status,
            approvedBy,
            adminNotes,
            new Date().toISOString(),
            approvedDate,
            expiryDate
          ], (err) => {
            if (err) {
              console.error(`❌ Error creating biometric request for ${resident.firstName} ${resident.lastName}:`, err);
              errors++;
            } else {
              console.log(`✅ Created biometric request for ${resident.firstName} ${resident.lastName} (${requestType}, ${status})`);
            }
            
            completed++;
            
            if (completed === residents.length) {
              console.log(`\n🎉 Biometric data seeding completed!`);
              console.log(`✅ Successfully created: ${completed - errors} biometric requests`);
              if (errors > 0) {
                console.log(`❌ Errors: ${errors}`);
              }
              
              // Show summary
              db.all("SELECT status, COUNT(*) as count FROM biometric_requests GROUP BY status", (err, summary) => {
                if (!err && summary.length > 0) {
                  console.log('\n📊 Biometric Requests Summary:');
                  summary.forEach(row => {
                    console.log(`   ${row.status}: ${row.count}`);
                  });
                }
                
                db.close();
                resolve(true);
              });
            }
          });
        });
      });
    });
  });
}

// Run the script
seedBiometricData().then(() => {
  console.log('🎉 Biometric data seeding complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Biometric data seeding failed:', error);
  process.exit(1);
});
