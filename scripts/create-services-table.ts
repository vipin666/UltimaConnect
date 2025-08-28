import sqlite3 from 'sqlite3';

const dbPath = './tower-connect.db';
const sqlite = new sqlite3.Database(dbPath);

async function createServicesTable() {
  console.log('Creating nearby_services table...');
  
  return new Promise((resolve, reject) => {
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS nearby_services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        phone TEXT,
        description TEXT,
        address TEXT,
        distanceKm REAL,
        latitude REAL,
        longitude REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err);
        reject(err);
      } else {
        console.log('nearby_services table created successfully!');
        resolve(true);
      }
    });
  });
}

createServicesTable()
  .then(() => {
    console.log('Table creation completed!');
    sqlite.close();
  })
  .catch(console.error);
