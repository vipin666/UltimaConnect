import sqlite3 from 'sqlite3';

async function seedVisitors() {
  console.log('🌱 Seeding visitor data...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Get all residents and watchmen
      db.all("SELECT id, firstName, lastName, unitNumber, role FROM users WHERE role IN ('resident', 'watchman')", (err, users) => {
        if (err) {
          console.error('❌ Error fetching users:', err);
          reject(err);
          return;
        }

        const residents = users.filter(u => u.role === 'resident');
        const watchmen = users.filter(u => u.role === 'watchman');

        console.log(`📋 Found ${residents.length} residents and ${watchmen.length} watchmen`);

        if (residents.length === 0 || watchmen.length === 0) {
          console.log('⚠️ Need both residents and watchmen to create visitors.');
          db.close();
          resolve(true);
          return;
        }

        let completed = 0;
        let errors = 0;

        // Create sample visitors
        const visitorNames = [
          'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
          'Lisa Anderson', 'Robert Taylor', 'Jennifer Martinez', 'Christopher Garcia', 'Amanda Rodriguez'
        ];

        const purposes = [
          'Family Visit', 'Delivery', 'Maintenance', 'Social Visit', 'Business Meeting',
          'Package Delivery', 'Service Call', 'Guest Visit', 'Inspection', 'Meeting'
        ];

        const vehicleNumbers = [
          'MH-12-AB-1234', 'MH-12-CD-5678', 'MH-12-EF-9012', 'MH-12-GH-3456', 'MH-12-IJ-7890',
          '', '', '', '', '' // Some visitors without vehicles
        ];

        const parkingSlots = ['G-01', 'G-02', 'G-03', '', '', '', '', '', '', ''];

        visitorNames.forEach((name, index) => {
          const visitorId = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const resident = residents[Math.floor(Math.random() * residents.length)];
          const watchman = watchmen[Math.floor(Math.random() * watchmen.length)];
          const purpose = purposes[Math.floor(Math.random() * purposes.length)];
          const vehicleNumber = vehicleNumbers[index];
          const parkingSlot = parkingSlots[index];
          const statuses = ['pending', 'approved', 'checked_in', 'checked_out'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          // Generate random arrival and departure times
          const now = new Date();
          const arrivalTime = new Date(now.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString();
          const departureTime = new Date(new Date(arrivalTime).getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000).toISOString();

          db.run(`
            INSERT OR IGNORE INTO visitors (
              id, name, phone, purpose, unitToVisit, hostUserId, status, expectedDuration,
              watchmanId, vehicleNumber, guestParkingSlot, accompanyingPersons, arrivalTime, departureTime
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            visitorId,
            name,
            `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            purpose,
            resident.unitNumber,
            resident.id,
            status,
            Math.floor(Math.random() * 4) + 1,
            watchman.id,
            vehicleNumber,
            parkingSlot,
            Math.floor(Math.random() * 3),
            arrivalTime,
            departureTime
          ], (err) => {
            if (err) {
              console.error(`❌ Error creating visitor ${name}:`, err);
              errors++;
            } else {
              console.log(`✅ Created visitor ${name} for Unit ${resident.unitNumber} (${status})`);
            }
            
            completed++;
            
            if (completed === visitorNames.length) {
              console.log(`\n🎉 Visitor data seeding completed!`);
              console.log(`✅ Successfully created: ${completed - errors} visitors`);
              if (errors > 0) {
                console.log(`❌ Errors: ${errors}`);
              }
              
              // Show summary
              db.all("SELECT status, COUNT(*) as count FROM visitors GROUP BY status", (err, summary) => {
                if (!err && summary.length > 0) {
                  console.log('\n📊 Visitors Summary:');
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

seedVisitors().then(() => {
  console.log('🎉 Visitor seeding complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Visitor seeding failed:', error);
  process.exit(1);
});
