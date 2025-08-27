import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

// Biometric data mapping from the original CSV
const biometricData = [
  // Residents with biometric IDs
  { name: 'ANN JOSEPH', biometric_id: '121', flat_no: '101 B' },
  { name: 'JOSEPH VAGHESE', biometric_id: '122', flat_no: '101 B' },
  { name: 'NOORIN SHEREEF', biometric_id: '131', flat_no: '101 C' },
  { name: 'FAHIM', biometric_id: '132', flat_no: '101 C' },
  { name: 'PAUL', biometric_id: '141', flat_no: '101 D' },
  { name: 'AKIN', biometric_id: '142', flat_no: '101 D' },
  { name: 'REXY', biometric_id: '143', flat_no: '101 D' },
  { name: 'ANIKA', biometric_id: '144', flat_no: '101 D' },
  { name: 'VINAYAK SASIKUMAR', biometric_id: '221', flat_no: '102 B' },
  { name: 'ANJALI', biometric_id: '222', flat_no: '102 B' },
  { name: 'JOSHY ABRAHAM', biometric_id: '241', flat_no: '102 D' },
  { name: 'BETSY', biometric_id: '242', flat_no: '102 D' },
  { name: 'ELIAMMA', biometric_id: '243', flat_no: '102 D' },
  { name: 'JUDITH', biometric_id: '244', flat_no: '102 D' },
  { name: 'JEREMY', biometric_id: '245', flat_no: '102 D' },
  { name: 'JILS', biometric_id: '321', flat_no: '103 B' },
  { name: 'ANIRUDH', biometric_id: '322', flat_no: '103 B' },
  { name: 'NIDHI', biometric_id: '323', flat_no: '103 B' },
  { name: 'LALITHA', biometric_id: '324', flat_no: '103 B' },
  { name: 'ANU', biometric_id: '325', flat_no: '103 B' },
  { name: 'SHAFI', biometric_id: '331', flat_no: '103 E' },
  { name: 'SHAHIRA', biometric_id: '332', flat_no: '103 E' },
  { name: 'ISHAL', biometric_id: '333', flat_no: '103 E' },
  { name: 'AKHIL', biometric_id: '341', flat_no: '103 F' },
  { name: 'ANILA', biometric_id: '342', flat_no: '103 F' },
  { name: 'KIRAN', biometric_id: '351', flat_no: '103 G' },
  { name: 'NEETHU', biometric_id: '352', flat_no: '103 G' },
  { name: 'VIPINDAS', biometric_id: '411', flat_no: '104 A' },
  { name: 'BHAVANA', biometric_id: '412', flat_no: '104 A' },
  { name: 'RAJEEV', biometric_id: '451', flat_no: '104 G' },
  { name: 'SANDHYA', biometric_id: '452', flat_no: '104 G' },
  { name: 'RITHWIK', biometric_id: '453', flat_no: '104 G' },
  { name: 'SOJAN GEORGE', biometric_id: '511', flat_no: '105 A' },
  { name: 'ANNAMMA GEORGE', biometric_id: '512', flat_no: '105 A' },
  { name: 'SOSU', biometric_id: '513', flat_no: '105 A' },
  { name: 'FIONA', biometric_id: '514', flat_no: '105 A' },
  { name: 'NAVEEN', biometric_id: '521', flat_no: '105 B' },
  { name: 'JAMES', biometric_id: '522', flat_no: '105 B' },
  { name: 'SINITH', biometric_id: '551', flat_no: '105 G' },
  { name: 'SHABNAM', biometric_id: '552', flat_no: '105 G' },
  { name: 'ARNIKA', biometric_id: '553', flat_no: '105 G' },
  { name: 'NITHYA', biometric_id: '621', flat_no: '106 B' },
  { name: 'RAHUL', biometric_id: '622', flat_no: '106 B' },
  { name: 'PRANAV', biometric_id: '623', flat_no: '106 B' },
  { name: 'JAYAKUMAR', biometric_id: '631', flat_no: '106 E' },
  { name: 'GREESHMA', biometric_id: '633', flat_no: '106 E' },
  { name: 'SREEJITH', biometric_id: '641', flat_no: '106 F' },
  { name: 'SMITHA', biometric_id: '642', flat_no: '106 F' },
  { name: 'ADITHYA', biometric_id: '643', flat_no: '106 F' },
  { name: 'MANICHAND', biometric_id: '651', flat_no: '106 G' },
  { name: 'NIKHILA', biometric_id: '652', flat_no: '106 G' },
  
  // Staff members (no biometric IDs in original data, but we'll generate them)
  { name: 'SUJITH', biometric_id: 'STAFF001', flat_no: 'STAFF' },
  { name: 'KHIMANADA', biometric_id: 'STAFF002', flat_no: 'STAFF' },
  { name: 'VARGHESE', biometric_id: 'STAFF003', flat_no: 'STAFF' },
  { name: 'RAVINDRA', biometric_id: 'STAFF004', flat_no: 'STAFF' },
  { name: 'AMMINI', biometric_id: 'STAFF005', flat_no: 'STAFF' },
  { name: 'REMANI', biometric_id: 'STAFF006', flat_no: 'STAFF' }
];

async function seedBiometricData() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔐 Seeding biometric data for all users...\n');
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const data of biometricData) {
        // Find the user by name and flat number
        const query = data.flat_no === 'STAFF' 
          ? 'SELECT id, firstName, lastName, username, role FROM users WHERE firstName = ? AND role IN ("staff", "caretaker", "watchman")'
          : 'SELECT id, firstName, lastName, username, role FROM users WHERE firstName = ? AND unitNumber = ?';
        
        const params = data.flat_no === 'STAFF' 
          ? [data.name] 
          : [data.name, data.flat_no];
        
        db.get(query, params, async (err, user) => {
          if (err) {
            console.error(`❌ Error finding user ${data.name}:`, err);
            errorCount++;
          } else if (!user) {
            console.log(`⚠️ User not found: ${data.name} (${data.flat_no})`);
            errorCount++;
          } else {
            // Check if biometric data already exists for this user
            db.get('SELECT id FROM biometric_requests WHERE userId = ?', [user.id], async (err, existing) => {
              if (err) {
                console.error(`❌ Error checking existing biometric data for ${data.name}:`, err);
                errorCount++;
              } else if (existing) {
                console.log(`⚠️ Biometric data already exists for ${data.name}`);
                errorCount++;
              } else {
                // Create biometric request
                const biometricId = `biometric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const requestData = {
                  id: biometricId,
                  userId: user.id,
                  biometricId: data.biometric_id,
                  requestType: 'registration',
                  status: 'approved',
                  approvedBy: 'system',
                  approvedAt: new Date().toISOString(),
                  notes: `Auto-seeded biometric data for ${data.name}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                
                db.run(`
                  INSERT INTO biometric_requests (
                    id, userId, biometricId, requestType, status, approvedBy, 
                    approvedAt, notes, createdAt, updatedAt
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                  requestData.id,
                  requestData.userId,
                  requestData.biometricId,
                  requestData.requestType,
                  requestData.status,
                  requestData.approvedBy,
                  requestData.approvedAt,
                  requestData.notes,
                  requestData.createdAt,
                  requestData.updatedAt
                ], (err) => {
                  if (err) {
                    console.error(`❌ Error creating biometric data for ${data.name}:`, err);
                    errorCount++;
                  } else {
                    console.log(`✅ Created biometric data for ${data.name} (${data.biometric_id})`);
                    successCount++;
                  }
                });
              }
            });
          }
        });
      }
      
      // Wait a bit for all operations to complete
      setTimeout(() => {
        console.log('\n📊 Biometric Data Seeding Summary:');
        console.log(`✅ Successfully created: ${successCount} biometric records`);
        console.log(`❌ Errors/Skipped: ${errorCount} records`);
        
        // Commit transaction
        setTimeout(() => {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('❌ Error committing transaction:', err);
              db.run('ROLLBACK');
            } else {
              console.log('\n🎉 Biometric data seeding completed successfully!');
              console.log('\n📝 Note: All biometric requests are set to "approved" status');
              console.log('🔐 Users can now use their biometric IDs for access control');
            }
            db.close();
          });
        }, 1000);
        
      }, 3000); // Wait for all operations to complete
      
    } catch (error) {
      console.error('❌ Error during biometric data seeding:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

seedBiometricData();
