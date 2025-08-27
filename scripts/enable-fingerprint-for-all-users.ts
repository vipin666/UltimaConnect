import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

console.log('🔐 Enabling fingerprint access for all users...\n');

async function enableFingerprintForAllUsers() {
  const db = new sqlite3.Database(dbPath);
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      // Get all users
      db.all('SELECT id, firstName, lastName, username, role, unitNumber FROM users WHERE role != "super_admin"', (err, users) => {
        if (err) {
          console.error('❌ Error fetching users:', err);
          db.run('ROLLBACK');
          db.close();
          return;
        }
        
        console.log(`📊 Found ${users.length} users to process...\n`);
        
        if (users.length === 0) {
          console.log('⚠️ No users found to enable fingerprint access.');
          db.run('ROLLBACK');
          db.close();
          return;
        }
        
        let processedCount = 0;
        
        users.forEach((user) => {
          // Check if biometric data already exists for this user
          db.get('SELECT id FROM biometric_requests WHERE userId = ?', [user.id], (err, existing) => {
            if (err) {
              console.error(`❌ Error checking existing biometric data for ${user.firstName}:`, err);
              errorCount++;
            } else if (existing) {
              console.log(`⚠️ Biometric data already exists for ${user.firstName} ${user.lastName} (${user.username})`);
              skippedCount++;
            } else {
              // Generate biometric ID based on user type and existing data
              let biometricId = '';
              
              if (user.role === 'resident') {
                // For residents, try to use existing biometric ID from CSV data
                const biometricMapping = {
                  'ANN JOSEPH': '121', 'JOSEPH VAGHESE': '122', 'NOORIN SHEREEF': '131', 'FAHIM': '132',
                  'PAUL': '141', 'AKIN': '142', 'REXY': '143', 'ANIKA': '144', 'VINAYAK SASIKUMAR': '221',
                  'ANJALI': '222', 'JOSHY ABRAHAM': '241', 'BETSY': '242', 'ELIAMMA': '243', 'JUDITH': '244',
                  'JEREMY': '245', 'JILS': '321', 'ANIRUDH': '322', 'NIDHI': '323', 'LALITHA': '324', 'ANU': '325',
                  'SHAFI': '331', 'SHAHIRA': '332', 'ISHAL': '333', 'AKHIL': '341', 'ANILA': '342', 'KIRAN': '351',
                  'NEETHU': '352', 'VIPINDAS': '411', 'BHAVANA': '412', 'RAJEEV': '451', 'SANDHYA': '452',
                  'RITHWIK': '453', 'SOJAN GEORGE': '511', 'ANNAMMA GEORGE': '512', 'SOSU': '513', 'FIONA': '514',
                  'NAVEEN': '521', 'JAMES': '522', 'SINITH': '551', 'SHABNAM': '552', 'ARNIKA': '553',
                  'NITHYA': '621', 'RAHUL': '622', 'PRANAV': '623', 'JAYAKUMAR': '631', 'GREESHMA': '633',
                  'SREEJITH': '641', 'SMITHA': '642', 'ADITHYA': '643', 'MANICHAND': '651', 'NIKHILA': '652'
                };
                
                const fullName = `${user.firstName} ${user.lastName}`.trim();
                biometricId = biometricMapping[fullName] || `RES${user.id.slice(-6)}`;
              } else if (user.role === 'staff' || user.role === 'caretaker' || user.role === 'watchman') {
                // For staff, generate staff-specific ID
                const staffMapping = {
                  'SUJITH': 'STAFF001', 'KHIMANADA': 'STAFF002', 'VARGHESE': 'STAFF003',
                  'RAVINDRA': 'STAFF004', 'AMMINI': 'STAFF005', 'REMANI': 'STAFF006'
                };
                biometricId = staffMapping[user.firstName] || `STAFF${user.id.slice(-6)}`;
              } else {
                // For other roles, generate generic ID
                biometricId = `USER${user.id.slice(-6)}`;
              }
              
              // Create biometric request
              const biometricRequestId = `biometric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const requestData = {
                id: biometricRequestId,
                userId: user.id,
                biometricId: biometricId,
                requestType: 'registration',
                status: 'approved',
                approvedBy: 'system',
                approvedAt: new Date().toISOString(),
                notes: `Auto-enabled fingerprint access for ${user.firstName} ${user.lastName}`,
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
                  console.error(`❌ Error creating biometric data for ${user.firstName} ${user.lastName}:`, err);
                  errorCount++;
                } else {
                  console.log(`✅ Enabled fingerprint access for ${user.firstName} ${user.lastName} (${user.username}) - ID: ${biometricId}`);
                  successCount++;
                }
                
                processedCount++;
                
                // Check if all users have been processed
                if (processedCount === users.length) {
                  // Show final summary
                  setTimeout(() => {
                    console.log('\n📊 Fingerprint Enablement Summary:');
                    console.log(`✅ Successfully enabled: ${successCount} users`);
                    console.log(`⚠️ Skipped (already exists): ${skippedCount} users`);
                    console.log(`❌ Errors: ${errorCount} users`);
                    console.log(`📊 Total processed: ${processedCount} users`);
                    
                    // Commit transaction
                    setTimeout(() => {
                      db.run('COMMIT', (err) => {
                        if (err) {
                          console.error('❌ Error committing transaction:', err);
                          db.run('ROLLBACK');
                        } else {
                          console.log('\n🎉 Fingerprint access enabled successfully!');
                          console.log('\n🔐 All users now have biometric access configured');
                          console.log('📱 Users can now use fingerprint authentication');
                          console.log('🏢 Access control systems can recognize all users');
                        }
                        db.close();
                      });
                    }, 1000);
                    
                  }, 2000); // Wait for all operations to complete
                }
              });
            }
          });
        });
      });
      
    } catch (error) {
      console.error('❌ Error during fingerprint enablement:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

enableFingerprintForAllUsers();
