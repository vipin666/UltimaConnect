import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function addGuestParking() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('Adding guest parking amenities...\n');
  
  const guestParkingAmenities = [
    {
      id: 'amenity-006',
      name: 'Guest Parking Slot 1',
      type: 'guest_parking',
      description: 'Guest parking slot 1 for visitors',
      status: 'active'
    },
    {
      id: 'amenity-007',
      name: 'Guest Parking Slot 2',
      type: 'guest_parking',
      description: 'Guest parking slot 2 for visitors',
      status: 'active'
    },
    {
      id: 'amenity-008',
      name: 'Guest Parking Slot 3',
      type: 'guest_parking',
      description: 'Guest parking slot 3 for visitors',
      status: 'active'
    }
  ];
  
  db.serialize(() => {
    guestParkingAmenities.forEach((amenity) => {
      db.run(
        'INSERT OR REPLACE INTO amenities (id, name, type, description) VALUES (?, ?, ?, ?)',
        [amenity.id, amenity.name, amenity.type, amenity.description],
        function(err) {
          if (err) {
            console.error(`Error adding ${amenity.name}:`, err);
          } else {
            console.log(`✅ Added: ${amenity.name}`);
          }
        }
      );
    });
    
    // Check if amenities were added
    setTimeout(() => {
      db.all('SELECT * FROM amenities WHERE type = "guest_parking"', (err, rows) => {
        if (err) {
          console.error('Error checking guest parking amenities:', err);
        } else {
          console.log('\nGuest parking amenities in database:');
          rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name} (${row.id})`);
          });
        }
        db.close();
      });
    }, 1000);
  });
}

addGuestParking().catch(console.error);
