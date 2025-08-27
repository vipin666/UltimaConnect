import sqlite3 from 'sqlite3';

async function seedAmenities() {
  console.log('Seeding amenities...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  const amenities = [
    {
      id: 'amenity-001',
      name: 'Swimming Pool',
      description: 'Olympic size swimming pool with changing rooms',
      type: 'swimming_pool',
      capacity: 20
    },
    {
      id: 'amenity-002',
      name: 'Gym',
      description: 'Fully equipped gym with cardio and strength training equipment',
      type: 'gym',
      capacity: 15
    },
    {
      id: 'amenity-003',
      name: 'Community Hall',
      description: 'Large hall for events and gatherings',
      type: 'community_hall',
      capacity: 100
    },
    {
      id: 'amenity-004',
      name: 'Garden',
      description: 'Beautiful garden area for relaxation',
      type: 'garden',
      capacity: 30
    },
    {
      id: 'amenity-005',
      name: 'Pool Table',
      description: 'Professional pool table in recreation room',
      type: 'pool_table',
      capacity: 4
    }
  ];

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO amenities (id, name, description, type, capacity, isActive)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      amenities.forEach(amenity => {
        stmt.run(
          amenity.id,
          amenity.name,
          amenity.description,
          amenity.type,
          amenity.capacity,
          true
        );
        console.log(`Added amenity: ${amenity.name}`);
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error seeding amenities:', err);
          reject(err);
        } else {
          console.log('Amenities seeded successfully!');
          resolve(true);
        }
        db.close();
      });
    });
  });
}

seedAmenities().catch(console.error);
