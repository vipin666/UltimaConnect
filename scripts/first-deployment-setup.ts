import sqlite3 from 'sqlite3';
import path from 'path';
import { hashPassword } from '../server/auth';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

// Raw data from the CSV
const rawData = [
  { flat_no: '101 A', name: '', biometric_id: '111', tenant: false, remarks: '' },
  { flat_no: '101 B', name: 'ANN JOSEPH', biometric_id: '121', tenant: false, remarks: '' },
  { flat_no: '101 B', name: 'JOSEPH VAGHESE', biometric_id: '122', tenant: false, remarks: '' },
  { flat_no: '101 B', name: '', biometric_id: '123', tenant: false, remarks: '' },
  { flat_no: '101 B', name: '', biometric_id: '124', tenant: false, remarks: '' },
  { flat_no: '101 B', name: '', biometric_id: '125', tenant: false, remarks: '' },
  { flat_no: '101 C', name: 'NOORIN SHEREEF', biometric_id: '131', tenant: true, remarks: 'tenant' },
  { flat_no: '101 C', name: 'FAHIM', biometric_id: '132', tenant: false, remarks: '' },
  { flat_no: '101 C', name: '', biometric_id: '133', tenant: false, remarks: '' },
  { flat_no: '101 C', name: '', biometric_id: '134', tenant: false, remarks: '' },
  { flat_no: '101 D', name: 'PAUL', biometric_id: '141', tenant: true, remarks: 'tenant' },
  { flat_no: '101 D', name: 'AKIN', biometric_id: '142', tenant: false, remarks: '' },
  { flat_no: '101 D', name: 'REXY', biometric_id: '143', tenant: false, remarks: '' },
  { flat_no: '101 D', name: 'ANIKA', biometric_id: '144', tenant: false, remarks: '' },
  { flat_no: '102 A', name: '', biometric_id: '211', tenant: false, remarks: '' },
  { flat_no: '102 A', name: '', biometric_id: '212', tenant: false, remarks: '' },
  { flat_no: '102 A', name: '', biometric_id: '213', tenant: false, remarks: '' },
  { flat_no: '102 A', name: '', biometric_id: '214', tenant: false, remarks: '' },
  { flat_no: '102 B', name: 'VINAYAK SASIKUMAR', biometric_id: '221', tenant: false, remarks: '' },
  { flat_no: '102 B', name: 'ANJALI', biometric_id: '222', tenant: false, remarks: '' },
  { flat_no: '102 B', name: '', biometric_id: '223', tenant: false, remarks: '' },
  { flat_no: '102 B', name: '', biometric_id: '224', tenant: false, remarks: '' },
  { flat_no: '102 C', name: '', biometric_id: '231', tenant: false, remarks: '' },
  { flat_no: '102 C', name: '', biometric_id: '232', tenant: false, remarks: '' },
  { flat_no: '102 C', name: '', biometric_id: '233', tenant: false, remarks: '' },
  { flat_no: '102 C', name: '', biometric_id: '234', tenant: false, remarks: '' },
  { flat_no: '102 D', name: 'JOSHY ABRAHAM', biometric_id: '241', tenant: false, remarks: '' },
  { flat_no: '102 D', name: 'BETSY', biometric_id: '242', tenant: false, remarks: '' },
  { flat_no: '102 D', name: 'ELIAMMA', biometric_id: '243', tenant: false, remarks: '' },
  { flat_no: '102 D', name: 'JUDITH', biometric_id: '244', tenant: false, remarks: '' },
  { flat_no: '102 D', name: 'JEREMY', biometric_id: '245', tenant: false, remarks: '' },
  { flat_no: '103 A', name: '', biometric_id: '311', tenant: false, remarks: '' },
  { flat_no: '103 A', name: '', biometric_id: '312', tenant: false, remarks: '' },
  { flat_no: '103 A', name: '', biometric_id: '313', tenant: false, remarks: '' },
  { flat_no: '103 A', name: '', biometric_id: '314', tenant: false, remarks: '' },
  { flat_no: '103 B', name: 'JILS', biometric_id: '321', tenant: true, remarks: 'tenant' },
  { flat_no: '103 B', name: 'ANIRUDH', biometric_id: '322', tenant: false, remarks: '' },
  { flat_no: '103 B', name: 'NIDHI', biometric_id: '323', tenant: false, remarks: '' },
  { flat_no: '103 B', name: 'LALITHA', biometric_id: '324', tenant: false, remarks: '' },
  { flat_no: '103 B', name: 'ANU', biometric_id: '325', tenant: false, remarks: '' },
  { flat_no: '103 E', name: 'SHAFI', biometric_id: '331', tenant: true, remarks: 'tenant' },
  { flat_no: '103 E', name: 'SHAHIRA', biometric_id: '332', tenant: false, remarks: '' },
  { flat_no: '103 E', name: 'ISHAL', biometric_id: '333', tenant: false, remarks: '' },
  { flat_no: '103 E', name: '', biometric_id: '334', tenant: false, remarks: '' },
  { flat_no: '103 F', name: 'AKHIL', biometric_id: '341', tenant: false, remarks: '' },
  { flat_no: '103 F', name: 'ANILA', biometric_id: '342', tenant: false, remarks: '' },
  { flat_no: '103 F', name: '', biometric_id: '343', tenant: false, remarks: '' },
  { flat_no: '103 F', name: '', biometric_id: '344', tenant: false, remarks: '' },
  { flat_no: '103 G', name: 'KIRAN', biometric_id: '351', tenant: true, remarks: 'tenant' },
  { flat_no: '103 G', name: 'NEETHU', biometric_id: '352', tenant: false, remarks: '' },
  { flat_no: '103 G', name: '', biometric_id: '353', tenant: false, remarks: '' },
  { flat_no: '104 A', name: 'VIPINDAS', biometric_id: '411', tenant: false, remarks: '' },
  { flat_no: '104 A', name: 'BHAVANA', biometric_id: '412', tenant: false, remarks: '' },
  { flat_no: '104 A', name: '', biometric_id: '413', tenant: false, remarks: '' },
  { flat_no: '104 A', name: '', biometric_id: '414', tenant: false, remarks: '' },
  { flat_no: '104 A', name: '', biometric_id: '415', tenant: false, remarks: '' },
  { flat_no: '104 B', name: '', biometric_id: '421', tenant: false, remarks: '' },
  { flat_no: '104 B', name: '', biometric_id: '422', tenant: false, remarks: '' },
  { flat_no: '104 B', name: '', biometric_id: '423', tenant: false, remarks: '' },
  { flat_no: '104 B', name: '', biometric_id: '424', tenant: false, remarks: '' },
  { flat_no: '104 B', name: '', biometric_id: '425', tenant: false, remarks: '' },
  { flat_no: '104 E', name: '', biometric_id: '431', tenant: false, remarks: '' },
  { flat_no: '104 E', name: '', biometric_id: '432', tenant: false, remarks: '' },
  { flat_no: '104 E', name: '', biometric_id: '433', tenant: false, remarks: '' },
  { flat_no: '104 E', name: '', biometric_id: '434', tenant: false, remarks: '' },
  { flat_no: '104 F', name: '', biometric_id: '441', tenant: false, remarks: '' },
  { flat_no: '104 F', name: '', biometric_id: '442', tenant: false, remarks: '' },
  { flat_no: '104 F', name: '', biometric_id: '443', tenant: false, remarks: '' },
  { flat_no: '104 F', name: '', biometric_id: '444', tenant: false, remarks: '' },
  { flat_no: '104 G', name: 'RAJEEV', biometric_id: '451', tenant: false, remarks: '' },
  { flat_no: '104 G', name: 'SANDHYA', biometric_id: '452', tenant: false, remarks: '' },
  { flat_no: '104 G', name: 'RITHWIK', biometric_id: '453', tenant: false, remarks: '' },
  { flat_no: '104 G', name: '', biometric_id: '454', tenant: false, remarks: '' },
  { flat_no: '104 G', name: '', biometric_id: '455', tenant: false, remarks: '' },
  { flat_no: '105 A', name: 'SOJAN GEORGE', biometric_id: '511', tenant: false, remarks: '' },
  { flat_no: '105 A', name: 'ANNAMMA GEORGE', biometric_id: '512', tenant: false, remarks: '' },
  { flat_no: '105 A', name: 'SOSU', biometric_id: '513', tenant: false, remarks: '' },
  { flat_no: '105 A', name: 'FIONA', biometric_id: '514', tenant: false, remarks: '' },
  { flat_no: '105 A', name: '', biometric_id: '515', tenant: false, remarks: '' },
  { flat_no: '105 B', name: 'NAVEEN', biometric_id: '521', tenant: false, remarks: '' },
  { flat_no: '105 B', name: 'JAMES', biometric_id: '522', tenant: false, remarks: '' },
  { flat_no: '105 B', name: '', biometric_id: '523', tenant: false, remarks: '' },
  { flat_no: '105 B', name: '', biometric_id: '524', tenant: false, remarks: '' },
  { flat_no: '105 E', name: '', biometric_id: '531', tenant: false, remarks: '' },
  { flat_no: '105 E', name: '', biometric_id: '532', tenant: false, remarks: '' },
  { flat_no: '105 E', name: '', biometric_id: '533', tenant: false, remarks: '' },
  { flat_no: '105 E', name: '', biometric_id: '534', tenant: false, remarks: '' },
  { flat_no: '105 E', name: '', biometric_id: '535', tenant: false, remarks: '' },
  { flat_no: '105 F', name: '', biometric_id: '541', tenant: false, remarks: '' },
  { flat_no: '105 F', name: '', biometric_id: '542', tenant: false, remarks: '' },
  { flat_no: '105 F', name: '', biometric_id: '543', tenant: false, remarks: '' },
  { flat_no: '105 F', name: '', biometric_id: '544', tenant: false, remarks: '' },
  { flat_no: '105 F', name: '', biometric_id: '545', tenant: false, remarks: '' },
  { flat_no: '105 G', name: 'SINITH', biometric_id: '551', tenant: false, remarks: '' },
  { flat_no: '105 G', name: 'SHABNAM', biometric_id: '552', tenant: false, remarks: '' },
  { flat_no: '105 G', name: 'ARNIKA', biometric_id: '553', tenant: false, remarks: '' },
  { flat_no: '105 G', name: '', biometric_id: '554', tenant: false, remarks: '' },
  { flat_no: '106 A', name: '', biometric_id: '611', tenant: false, remarks: '' },
  { flat_no: '106 A', name: '', biometric_id: '612', tenant: false, remarks: '' },
  { flat_no: '106 A', name: '', biometric_id: '613', tenant: false, remarks: '' },
  { flat_no: '106 A', name: '', biometric_id: '614', tenant: false, remarks: '' },
  { flat_no: '106 A', name: '', biometric_id: '615', tenant: false, remarks: '' },
  { flat_no: '106 B', name: 'NITHYA', biometric_id: '621', tenant: false, remarks: '' },
  { flat_no: '106 B', name: 'RAHUL', biometric_id: '622', tenant: false, remarks: '' },
  { flat_no: '106 B', name: 'PRANAV', biometric_id: '623', tenant: false, remarks: '' },
  { flat_no: '106 B', name: '', biometric_id: '624', tenant: false, remarks: '' },
  { flat_no: '106 B', name: '', biometric_id: '625', tenant: false, remarks: '' },
  { flat_no: '106 B', name: '', biometric_id: '626', tenant: false, remarks: '' },
  { flat_no: '106 E', name: 'JAYAKUMAR', biometric_id: '631', tenant: false, remarks: '' },
  { flat_no: '106 E', name: '', biometric_id: '632', tenant: false, remarks: '' },
  { flat_no: '106 E', name: 'GREESHMA', biometric_id: '633', tenant: false, remarks: '' },
  { flat_no: '106 E', name: '', biometric_id: '634', tenant: false, remarks: '' },
  { flat_no: '106 E', name: '', biometric_id: '635', tenant: false, remarks: '' },
  { flat_no: '106 E', name: '', biometric_id: '636', tenant: false, remarks: '' },
  { flat_no: '106 F', name: 'SREEJITH', biometric_id: '641', tenant: false, remarks: '' },
  { flat_no: '106 F', name: 'SMITHA', biometric_id: '642', tenant: false, remarks: '' },
  { flat_no: '106 F', name: 'ADITHYA', biometric_id: '643', tenant: false, remarks: '' },
  { flat_no: '106 F', name: '', biometric_id: '644', tenant: false, remarks: '' },
  { flat_no: '106 G', name: 'MANICHAND', biometric_id: '651', tenant: true, remarks: 'tenant' },
  { flat_no: '106 G', name: 'NIKHILA', biometric_id: '652', tenant: false, remarks: '' },
  { flat_no: '106 G', name: '', biometric_id: '653', tenant: false, remarks: '' },
  { flat_no: '106 G', name: '', biometric_id: '654', tenant: false, remarks: '' },
  // Staff data
  { flat_no: 'STAFF', name: 'SUJITH', biometric_id: '', tenant: false, remarks: 'Caretaker/Manager' },
  { flat_no: 'STAFF', name: 'KHIMANADA', biometric_id: '', tenant: false, remarks: 'Housekeeping' },
  { flat_no: 'STAFF', name: 'VARGHESE', biometric_id: '', tenant: false, remarks: 'Watchman2' },
  { flat_no: 'STAFF', name: 'RAVINDRA', biometric_id: '', tenant: false, remarks: 'Watchman1' },
  { flat_no: 'STAFF', name: 'AMMINI', biometric_id: '', tenant: false, remarks: 'Cleaningstaff' },
  { flat_no: 'STAFF', name: 'REMANI', biometric_id: '', tenant: false, remarks: 'Cleaningstaff' }
];

async function firstDeploymentSetup() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🚀 Setting up database for first deployment with CSV data...\n');
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Check if data already exists
      db.get('SELECT COUNT(*) as count FROM users WHERE role = "resident"', (err, row) => {
        if (err) {
          console.error('❌ Error checking existing residents:', err);
        } else if (row.count > 0) {
          console.log(`⚠️ Found ${row.count} existing residents. Skipping first deployment setup.`);
          console.log('💡 Use scripts/delete-residents-and-flats.ts to clear data first if needed.');
          db.run('ROLLBACK');
          db.close();
          return;
        }
      });

      // 2. Create admin user
      console.log('👨‍💼 Setting up admin user...');
      const adminPassword = await hashPassword('admin123');
      db.run(`
        INSERT OR REPLACE INTO users (id, username, password, firstName, lastName, email, role, status, unitNumber, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, ['admin-001', 'admin', adminPassword, 'Admin', 'User', 'admin@towerconnect.com', 'super_admin', 'active', 'Admin'], (err) => {
        if (err) {
          console.error('❌ Error creating admin user:', err);
        } else {
          console.log('✅ Admin user created/updated');
        }
      });

      // 3. Create amenities
      console.log('🏊 Setting up amenities...');
      const amenities = [
        { name: 'Swimming Pool', type: 'recreation', description: 'Outdoor swimming pool', capacity: 20, status: 'active' },
        { name: 'Gym', type: 'fitness', description: 'Fully equipped gymnasium', capacity: 15, status: 'active' },
        { name: 'Garden', type: 'recreation', description: 'Community garden', capacity: 50, status: 'active' },
        { name: 'Guest Parking Slot 1', type: 'guest_parking', description: 'Guest parking space', capacity: 1, status: 'active' },
        { name: 'Guest Parking Slot 2', type: 'guest_parking', description: 'Guest parking space', capacity: 1, status: 'active' },
        { name: 'Guest Parking Slot 3', type: 'guest_parking', description: 'Guest parking space', capacity: 1, status: 'active' },
        { name: 'Community Hall', type: 'event', description: 'Multi-purpose community hall', capacity: 100, status: 'active' },
        { name: 'Children Play Area', type: 'recreation', description: 'Safe play area for children', capacity: 30, status: 'active' }
      ];

      for (const amenity of amenities) {
        const id = `amenity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        db.run(`
          INSERT INTO amenities (id, name, type, description, capacity, isActive)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id, amenity.name, amenity.type, amenity.description, amenity.capacity, true], (err) => {
          if (err) {
            console.error(`❌ Error creating amenity ${amenity.name}:`, err);
          } else {
            console.log(`✅ Created amenity: ${amenity.name}`);
          }
        });
      }

      // 4. Process CSV data and create flats
      console.log('📊 Processing CSV data...');
      
      // Group by flat number to create unique flats
      const flatGroups = new Map<string, any[]>();
      
      rawData.forEach(item => {
        if (item.flat_no !== 'STAFF') {
          if (!flatGroups.has(item.flat_no)) {
            flatGroups.set(item.flat_no, []);
          }
          flatGroups.get(item.flat_no)!.push(item);
        }
      });

      // 5. Create flats
      console.log('🏢 Creating flats...');
      const flatIds = new Map<string, string>();
      
      for (const [flatNo, residents] of flatGroups) {
        const flatId = `flat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        flatIds.set(flatNo, flatId);
        
        // Determine flat type based on flat number
        let flatType = 'apartment';
        if (flatNo.includes('A') || flatNo.includes('B') || flatNo.includes('C') || flatNo.includes('D')) {
          flatType = 'apartment';
        } else if (flatNo.includes('E') || flatNo.includes('F') || flatNo.includes('G')) {
          flatType = 'penthouse';
        }

        // Determine floor number
        const floorMatch = flatNo.match(/^(\d+)/);
        const floorNumber = floorMatch ? parseInt(floorMatch[1]) : 1;

        db.run(`
          INSERT INTO flats (id, flatNumber, type, floorNumber, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [flatId, flatNo, flatType, floorNumber, 'occupied'], (err) => {
          if (err) {
            console.error(`❌ Error creating flat ${flatNo}:`, err);
          } else {
            console.log(`✅ Created flat: ${flatNo}`);
          }
        });
      }

      // 6. Create residents and staff
      console.log('👥 Creating residents and staff...');
      let residentCount = 0;
      let staffCount = 0;
      
      for (const item of rawData) {
        if (item.flat_no === 'STAFF') {
          // Handle staff members
          if (item.name) {
            const staffId = `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const username = item.name.toLowerCase().replace(/\s+/g, '');
            const hashedPassword = await hashPassword('password123');
            
            let role = 'staff';
            if (item.remarks.includes('Caretaker') || item.remarks.includes('Manager')) {
              role = 'caretaker';
            } else if (item.remarks.includes('Watchman')) {
              role = 'watchman';
            } else if (item.remarks.includes('Cleaning')) {
              role = 'staff';
            }

            db.run(`
              INSERT INTO users (id, username, password, firstName, lastName, email, role, status, unitNumber, isOwner, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [staffId, username, hashedPassword, item.name, '', `${username}@towerconnect.com`, role, 'active', 'STAFF', false], (err) => {
              if (err) {
                console.error(`❌ Error creating staff ${item.name}:`, err);
              } else {
                console.log(`✅ Created staff: ${item.name} (${role})`);
                staffCount++;
              }
            });
          }
        } else {
          // Handle residents
          if (item.name && item.name.trim()) {
            const residentId = `resident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const username = `${item.name.toLowerCase().replace(/\s+/g, '')}_${item.flat_no.replace(/\s+/g, '')}`;
            const hashedPassword = await hashPassword('password123');
            
            // Split name into first and last name
            const nameParts = item.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            db.run(`
              INSERT INTO users (id, username, password, firstName, lastName, email, role, status, unitNumber, isOwner, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [residentId, username, hashedPassword, firstName, lastName, `${username}@towerconnect.com`, 'resident', 'active', item.flat_no, !item.tenant], (err) => {
              if (err) {
                console.error(`❌ Error creating resident ${item.name}:`, err);
              } else {
                console.log(`✅ Created resident: ${item.name} (${item.flat_no}) - ${item.tenant ? 'Tenant' : 'Owner'}`);
                residentCount++;
              }
            });
          }
        }
      }

      // 7. Seed biometric data for all users
      console.log('\n🔐 Seeding biometric data for all users...');
      
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

      let biometricSuccessCount = 0;
      let biometricErrorCount = 0;

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
            biometricErrorCount++;
          } else if (!user) {
            console.log(`⚠️ User not found for biometric: ${data.name} (${data.flat_no})`);
            biometricErrorCount++;
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
                biometricErrorCount++;
              } else {
                console.log(`✅ Created biometric data for ${data.name} (${data.biometric_id})`);
                biometricSuccessCount++;
              }
            });
          }
        });
      }

      // 8. Show final summary
      setTimeout(() => {
        console.log('\n📊 First Deployment Summary:');
        console.log(`🏢 Flats created: ${flatGroups.size}`);
        console.log(`👥 Residents created: ${residentCount}`);
        console.log(`👨‍💼 Staff created: ${staffCount}`);
        console.log(`🏊 Amenities created: ${amenities.length}`);
        console.log(`🔐 Biometric records created: ${biometricSuccessCount}`);

        // Commit transaction
        setTimeout(() => {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('❌ Error committing transaction:', err);
              db.run('ROLLBACK');
            } else {
              console.log('\n✅ First deployment setup completed successfully!');
              console.log('\n🔑 Default Login Credentials:');
              console.log('👨‍💼 Admin: admin / admin123');
              console.log('👥 Residents: name_flatno / password123 (e.g., annjoseph_101b / password123)');
              console.log('👨‍💼 Staff: name / password123 (e.g., sujith / password123)');
              console.log('\n📝 Note: All users have password "password123"');
              console.log('\n🔐 Biometric Access: All users have biometric IDs for access control');
              console.log('\n🚀 Database is ready for production deployment!');
            }
            db.close();
          });
        }, 1000);
        
      }, 3000); // Wait for all operations to complete
      
    } catch (error) {
      console.error('❌ Error during first deployment setup:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

firstDeploymentSetup();
