import sqlite3 from 'sqlite3';
import { hashPassword } from '../server/auth.js';
import fs from 'fs';
import path from 'path';

interface Resident {
  flat_number: string;
  name: string;
  id: string | null;
  role: string;
}

interface ResidentsData {
  residents: Resident[];
}

async function seedResidents() {
  console.log('🌱 Seeding residents database...');
  
  // Read the JSON file
  const jsonPath = path.join(process.cwd(), 'SocietyResidents.json');
  let residentsData: ResidentsData;
  
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    residentsData = JSON.parse(jsonContent);
  } catch (error) {
    console.error('❌ Error reading JSON file:', error);
    return;
  }
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, let's check if we have any existing users
      db.get("SELECT COUNT(*) as count FROM users", (err, row: any) => {
        if (err) {
          console.error('Error checking existing users:', err);
          reject(err);
          return;
        }
        
        if (row.count > 0) {
          console.log(`⚠️  Database already has ${row.count} users. Skipping seeding.`);
          db.close();
          resolve(true);
          return;
        }
        
        console.log(`📊 Found ${residentsData.residents.length} residents to import`);
        
        // Filter out entries with null names or empty names
        const validResidents = residentsData.residents.filter(
          resident => resident.name && resident.name.trim() !== '' && resident.name !== 'A' && resident.name !== 'B' && resident.name !== 'C' && resident.name !== 'D' && resident.name !== 'E' && resident.name !== 'F' && resident.name !== 'G' && resident.name !== 'H' && resident.name !== 'I' && resident.name !== 'J' && resident.name !== 'K' && resident.name !== 'L' && resident.name !== 'M' && resident.name !== 'N' && resident.name !== 'O' && resident.name !== 'P' && resident.name !== 'Q' && resident.name !== 'R' && resident.name !== 'S' && resident.name !== 'T' && resident.name !== 'U' && resident.name !== 'V' && resident.name !== 'W' && resident.name !== 'X' && resident.name !== 'Y' && resident.name !== 'Z' && resident.name !== 'NAME' && resident.name !== 'ID' && resident.name !== 'REMARKS' && resident.name !== 'TENENT'
        );
        
        console.log(`✅ Filtered to ${validResidents.length} valid residents`);
        
        let insertedCount = 0;
        let skippedCount = 0;
        
        // Create admin user first
        const adminPassword = 'admin123';
        hashPassword(adminPassword).then(hashedPassword => {
          db.run(`INSERT OR IGNORE INTO users (id, username, password, firstName, lastName, email, unitNumber, role, status, isOwner) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['admin-001', 'admin', hashedPassword, 'Admin', 'User', 'admin@towerconnect.local', 'Admin', 'super_admin', 'active', true],
            (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
              } else {
                console.log('✅ Admin user created/verified');
              }
            }
          );
          
          // Process each resident
          validResidents.forEach((resident, index) => {
            const names = resident.name.trim().split(' ');
            const firstName = names[0] || 'Unknown';
            const lastName = names.slice(1).join(' ') || 'Unknown';
            const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${resident.flat_number}`.replace(/[^a-zA-Z0-9]/g, '');
            const email = `${username}@towerconnect.local`;
            const unitNumber = resident.flat_number;
            const role = resident.role === 'owner' ? 'resident' : 'resident';
            const status = 'active';
            const isOwner = resident.role === 'owner';
            
            // Generate a simple password based on flat number
            const password = `resident${unitNumber}`;
            
            hashPassword(password).then(hashedPassword => {
              db.run(`INSERT OR IGNORE INTO users (id, username, password, firstName, lastName, email, unitNumber, role, status, isOwner) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [`resident-${index + 1}`, username, hashedPassword, firstName, lastName, email, unitNumber, role, status, isOwner],
                function(err) {
                  if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                      skippedCount++;
                    } else {
                      console.error(`Error inserting resident ${resident.name}:`, err);
                    }
                  } else {
                    insertedCount++;
                    console.log(`✅ Added: ${firstName} ${lastName} (${unitNumber}) - Username: ${username}, Password: ${password}`);
                  }
                  
                  // Check if this is the last resident
                  if (insertedCount + skippedCount === validResidents.length) {
                    console.log(`\n🎉 Seeding complete!`);
                    console.log(`📊 Summary:`);
                    console.log(`   - Total residents processed: ${validResidents.length}`);
                    console.log(`   - Successfully inserted: ${insertedCount}`);
                    console.log(`   - Skipped (duplicates): ${skippedCount}`);
                    console.log(`\n🔑 Login Credentials:`);
                    console.log(`   - Admin: username=admin, password=admin123`);
                    console.log(`   - Residents: username=<firstname><lastname><flat>, password=resident<flat>`);
                    console.log(`   - Example: username=vipindas104, password=resident104`);
                    
                    db.close((err) => {
                      if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                      } else {
                        resolve(true);
                      }
                    });
                  }
                }
              );
            });
          });
        });
      });
    });
  });
}

// Run the script
seedResidents().then(() => {
  console.log('🎉 Database seeding complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Database seeding failed:', error);
  process.exit(1);
});
