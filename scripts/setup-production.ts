import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

function setupProduction() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🚀 Setting up database for production deployment...\n');
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Ensure admin user exists
      console.log('👨‍💼 Setting up admin user...');
      const adminPassword = await bcrypt.hash('admin123', 10);
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
      
      // 2. Ensure watchman user exists
      console.log('👮 Setting up watchman user...');
      const watchmanPassword = await bcrypt.hash('watchman123', 10);
      db.run(`
        INSERT OR REPLACE INTO users (id, username, password, firstName, lastName, email, role, status, unitNumber, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, ['watchman-001', 'watchman', watchmanPassword, 'Watchman', 'User', 'watchman@towerconnect.com', 'watchman', 'active', 'Watchman'], (err) => {
        if (err) {
          console.error('❌ Error creating watchman user:', err);
        } else {
          console.log('✅ Watchman user created/updated');
        }
      });
      
      // 3. Create residents (1-50)
      console.log('👥 Setting up resident users...');
      for (let i = 1; i <= 50; i++) {
        const residentPassword = await bcrypt.hash(`resident${i}`, 10);
        const unitNumber = `A${i.toString().padStart(2, '0')}`;
        
        db.run(`
          INSERT OR REPLACE INTO users (id, username, password, firstName, lastName, email, role, status, unitNumber, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          `resident-${i}`,
          `vipindasunknow${i}`,
          residentPassword,
          `Resident`,
          `${i}`,
          `resident${i}@towerconnect.com`,
          'resident',
          'active',
          unitNumber
        ], (err) => {
          if (err) {
            console.error(`❌ Error creating resident ${i}:`, err);
          }
        });
      }
      console.log('✅ 50 resident users created/updated');
      
      // 4. Create committee members
      console.log('👨‍💼 Setting up committee members...');
      const committeeMembers = [
        {
          id: 'caretaker-001',
          username: 'caretaker',
          password: 'caretaker123',
          firstName: 'Caretaker',
          lastName: 'Manager',
          email: 'caretaker@towerconnect.com',
          role: 'caretaker',
          phone: '+91-9876543210',
          description: 'Building caretaker responsible for daily maintenance'
        },
        {
          id: 'secretary-001',
          username: 'secretary',
          password: 'secretary123',
          firstName: 'Secretary',
          lastName: 'Officer',
          email: 'secretary@towerconnect.com',
          role: 'secretary',
          phone: '+91-9876543211',
          description: 'Society secretary handling administrative tasks'
        },
        {
          id: 'president-001',
          username: 'president',
          password: 'president123',
          firstName: 'President',
          lastName: 'Chairman',
          email: 'president@towerconnect.com',
          role: 'president',
          phone: '+91-9876543212',
          description: 'Society president overseeing all operations'
        },
        {
          id: 'treasurer-001',
          username: 'treasurer',
          password: 'treasurer123',
          firstName: 'Treasurer',
          lastName: 'Finance',
          email: 'treasurer@towerconnect.com',
          role: 'treasurer',
          phone: '+91-9876543213',
          description: 'Society treasurer managing financial matters'
        }
      ];
      
      for (const member of committeeMembers) {
        const hashedPassword = await bcrypt.hash(member.password, 10);
        db.run(`
          INSERT OR REPLACE INTO users (id, username, password, firstName, lastName, email, role, status, unitNumber, phone, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          member.id,
          member.username,
          hashedPassword,
          member.firstName,
          member.lastName,
          member.email,
          member.role,
          'active',
          member.role.toUpperCase(),
          member.phone
        ], (err) => {
          if (err) {
            console.error(`❌ Error creating ${member.role}:`, err);
          }
        });
      }
      console.log('✅ Committee members created/updated');
      
      // 5. Create flats (1-50)
      console.log('🏠 Setting up flats...');
      for (let i = 1; i <= 50; i++) {
        const unitNumber = `A${i.toString().padStart(2, '0')}`;
        const floorNumber = Math.ceil(i / 4); // 4 flats per floor
        
        db.run(`
          INSERT OR REPLACE INTO flats (id, flatNumber, floorNumber, type, bedrooms, bathrooms, area, rentAmount, isOccupied, status, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          `flat-${i}`,
          unitNumber,
          floorNumber,
          'apartment',
          2,
          2,
          1200,
          15000,
          false,
          'available'
        ], (err) => {
          if (err) {
            console.error(`❌ Error creating flat ${i}:`, err);
          }
        });
      }
      console.log('✅ 50 flats created/updated');
      
      // 6. Create amenities
      console.log('🏊 Setting up amenities...');
      const amenities = [
        {
          id: 'amenity-001',
          name: 'Swimming Pool',
          type: 'swimming_pool',
          description: 'Large swimming pool with changing rooms',
          capacity: 20,
          isActive: true
        },
        {
          id: 'amenity-002',
          name: 'Gym',
          type: 'gym',
          description: 'Fully equipped gym with modern equipment',
          capacity: 15,
          isActive: true
        },
        {
          id: 'amenity-003',
          name: 'Community Hall',
          type: 'community_hall',
          description: 'Large community hall for events and gatherings',
          capacity: 100,
          isActive: true
        },
        {
          id: 'amenity-004',
          name: 'Garden',
          type: 'garden',
          description: 'Beautiful garden with walking paths',
          capacity: 50,
          isActive: true
        },
        {
          id: 'amenity-005',
          name: 'Party Hall',
          type: 'party_hall',
          description: 'Dedicated party hall for celebrations',
          capacity: 80,
          isActive: true
        },
        {
          id: 'amenity-006',
          name: 'Guest Parking Slot 1',
          type: 'guest_parking',
          description: 'Guest parking slot 1 for visitors',
          capacity: 1,
          isActive: true
        },
        {
          id: 'amenity-007',
          name: 'Guest Parking Slot 2',
          type: 'guest_parking',
          description: 'Guest parking slot 2 for visitors',
          capacity: 1,
          isActive: true
        },
        {
          id: 'amenity-008',
          name: 'Guest Parking Slot 3',
          type: 'guest_parking',
          description: 'Guest parking slot 3 for visitors',
          capacity: 1,
          isActive: true
        }
      ];
      
      for (const amenity of amenities) {
        db.run(`
          INSERT OR REPLACE INTO amenities (id, name, type, description, capacity, isActive, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          amenity.id,
          amenity.name,
          amenity.type,
          amenity.description,
          amenity.capacity,
          amenity.isActive
        ], (err) => {
          if (err) {
            console.error(`❌ Error creating amenity ${amenity.name}:`, err);
          }
        });
      }
      console.log('✅ 8 amenities created/updated');
      
      // Commit transaction
      setTimeout(() => {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Error committing transaction:', err);
            db.run('ROLLBACK');
          } else {
            console.log('\n✅ Production setup completed successfully!');
            console.log('\n📊 Database summary:');
            
            // Show final counts
            db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
              if (err) {
                console.error('❌ Error counting users:', err);
              } else {
                console.log(`👥 Total Users: ${rows[0].count}`);
              }
            });
            
            db.all('SELECT COUNT(*) as count FROM flats', (err, rows) => {
              if (err) {
                console.error('❌ Error counting flats:', err);
              } else {
                console.log(`🏠 Total Flats: ${rows[0].count}`);
              }
            });
            
            db.all('SELECT COUNT(*) as count FROM amenities', (err, rows) => {
              if (err) {
                console.error('❌ Error counting amenities:', err);
              } else {
                console.log(`🏊 Total Amenities: ${rows[0].count}`);
              }
            });
            
            console.log('\n🔑 Default Login Credentials:');
            console.log('👨‍💼 Admin: admin / admin123');
            console.log('👮 Watchman: watchman / watchman123');
            console.log('👨‍💼 Caretaker: caretaker / caretaker123');
            console.log('👨‍💼 Secretary: secretary / secretary123');
            console.log('👨‍💼 President: president / president123');
            console.log('👨‍💼 Treasurer: treasurer / treasurer123');
            console.log('👥 Residents: vipindasunknow1 / resident1 (up to vipindasunknow50 / resident50)');
            
            console.log('\n🚀 Database is ready for production deployment!');
          }
          db.close();
        });
      }, 3000); // Wait for all operations to complete
      
    } catch (error) {
      console.error('❌ Error during production setup:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

setupProduction();
