import sqlite3 from 'sqlite3';
import { hashPassword } from '../server/auth.js';

async function createDatabase() {
  console.log('Creating database schema...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        unitNumber TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'resident',
        status TEXT NOT NULL DEFAULT 'pending',
        isOwner BOOLEAN NOT NULL DEFAULT true,
        profileImageUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create posts table
      db.run(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'general',
        authorId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        likes INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (authorId) REFERENCES users (id)
      )`);

      // Create comments table
      db.run(`CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        postId TEXT NOT NULL,
        authorId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (postId) REFERENCES posts (id),
        FOREIGN KEY (authorId) REFERENCES users (id)
      )`);

      // Create amenities table
      db.run(`CREATE TABLE IF NOT EXISTS amenities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        capacity INTEGER,
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create bookings table
      db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        amenityId TEXT NOT NULL,
        bookingDate DATE NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (amenityId) REFERENCES amenities (id)
      )`);

      // Create post_likes table
      db.run(`CREATE TABLE IF NOT EXISTS post_likes (
        id TEXT PRIMARY KEY,
        postId TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (postId) REFERENCES posts (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        UNIQUE(postId, userId)
      )`);

      // Create maintenance_requests table
      db.run(`CREATE TABLE IF NOT EXISTS maintenance_requests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'pending',
        unitNumber TEXT NOT NULL,
        userId TEXT NOT NULL,
        assignedTo TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )`);

      // Create messages table
      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        senderId TEXT NOT NULL,
        receiverId TEXT NOT NULL,
        content TEXT NOT NULL,
        isRead BOOLEAN DEFAULT false,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users (id),
        FOREIGN KEY (receiverId) REFERENCES users (id)
      )`);

      // Create announcements table
      db.run(`CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        authorId TEXT NOT NULL,
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (authorId) REFERENCES users (id)
      )`);

      // Create guest_notifications table
      db.run(`CREATE TABLE IF NOT EXISTS guest_notifications (
        id TEXT PRIMARY KEY,
        hostId TEXT NOT NULL,
        guestName TEXT NOT NULL,
        guestPhone TEXT,
        visitDate DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hostId) REFERENCES users (id)
      )`);

      // Create password_reset_tokens table
      db.run(`CREATE TABLE IF NOT EXISTS passwordResetTokens (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT NOT NULL,
        expiresAt DATETIME NOT NULL,
        used BOOLEAN DEFAULT false,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )`);

      // Create biometric_requests table
      db.run(`CREATE TABLE IF NOT EXISTS biometric_requests (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        requestType TEXT NOT NULL,
        reason TEXT,
        accessLevel TEXT DEFAULT 'basic',
        status TEXT NOT NULL DEFAULT 'pending',
        approvedBy TEXT,
        adminNotes TEXT,
        requestDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        approvedDate DATETIME,
        expiryDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (approvedBy) REFERENCES users (id)
      )`);

      // Create flats table
      db.run(`CREATE TABLE IF NOT EXISTS flats (
        id TEXT PRIMARY KEY,
        flatNumber TEXT UNIQUE NOT NULL,
        floorNumber INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'apartment', -- 'apartment', 'penthouse', 'studio'
        bedrooms INTEGER DEFAULT 1,
        bathrooms INTEGER DEFAULT 1,
        area REAL, -- in sq ft
        rentAmount REAL, -- for tenants
        isOccupied BOOLEAN DEFAULT false,
        ownerId TEXT, -- if owned by someone
        status TEXT NOT NULL DEFAULT 'available', -- 'available', 'occupied', 'maintenance'
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ownerId) REFERENCES users (id)
      )`);

      // Create visitors table
      db.run(`CREATE TABLE IF NOT EXISTS visitors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        purpose TEXT NOT NULL,
        purposeDetails TEXT,
        unitToVisit TEXT NOT NULL,
        hostUserId TEXT NOT NULL,
        photoUrl TEXT,
        idProofType TEXT,
        idProofNumber TEXT,
        idProofPhotoUrl TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        checkInTime DATETIME,
        checkOutTime DATETIME,
        expectedDuration TEXT,
        actualDuration TEXT,
        verificationNotes TEXT,
        watchmanId TEXT NOT NULL,
        verifiedBy TEXT,
        verifiedAt DATETIME,
        rejectionReason TEXT,
        emergencyContact TEXT,
        vehicleNumber TEXT,
        guestParkingSlot TEXT,
        accompanyingPersons INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hostUserId) REFERENCES users (id),
        FOREIGN KEY (watchmanId) REFERENCES users (id),
        FOREIGN KEY (verifiedBy) REFERENCES users (id)
      )`);

      // Create admin user
      db.get("SELECT id FROM users WHERE username = 'admin'", async (err, row) => {
        if (err) {
          console.error('Error checking admin user:', err);
          reject(err);
          return;
        }
        
        if (!row) {
          const adminPassword = await hashPassword('admin123');
          db.run(`INSERT INTO users (id, username, password, firstName, lastName, email, unitNumber, role, status, isOwner) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['admin-001', 'admin', adminPassword, 'Admin', 'User', 'admin@towerconnect.local', 'Admin', 'super_admin', 'active', true],
            (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
                reject(err);
              } else {
                console.log('✅ Admin user created successfully!');
                console.log('Username: admin');
                console.log('Password: admin123');
                console.log('Role: super_admin');
              }
            }
          );
        } else {
          console.log('✅ Admin user already exists.');
        }
      });

      // Insert some sample amenities
      db.run(`INSERT OR IGNORE INTO amenities (id, name, description, type, capacity) VALUES 
        ('amenity-001', 'Swimming Pool', 'Outdoor swimming pool with changing rooms', 'recreation', 20),
        ('amenity-002', 'Gym', 'Fully equipped fitness center', 'fitness', 15),
        ('amenity-003', 'Community Hall', 'Multi-purpose hall for events', 'event', 50),
        ('amenity-004', 'Garden', 'Beautiful landscaped garden', 'recreation', 30)
      `);

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('✅ Database created successfully!');
          resolve(true);
        }
      });
    });
  });
}

// Run the script
createDatabase().then(() => {
  console.log('🎉 Database setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Database setup failed:', error);
  process.exit(1);
});
