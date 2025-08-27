import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function cleanupDuplicateBookings() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🧹 Cleaning up duplicate bookings...\n');
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Find and remove duplicate user-amenity-date bookings (keep the most recent one)
      console.log('👤 Cleaning up duplicate user-amenity-date bookings...');
      db.run(`
        DELETE FROM bookings 
        WHERE id NOT IN (
          SELECT MAX(id) 
          FROM bookings 
          WHERE status IN ('pending', 'confirmed')
          GROUP BY userId, amenityId, bookingDate
        )
        AND status IN ('pending', 'confirmed')
      `, (err) => {
        if (err) {
          console.error('❌ Error cleaning up user duplicates:', err);
        } else {
          console.log('✅ Duplicate user-amenity-date bookings cleaned up');
        }
      });

      // 2. Find and remove duplicate guest parking slot bookings (keep the most recent one)
      console.log('🅿️ Cleaning up duplicate guest parking slot bookings...');
      db.run(`
        DELETE FROM bookings 
        WHERE id NOT IN (
          SELECT MAX(b.id) 
          FROM bookings b
          JOIN amenities a ON b.amenityId = a.id
          WHERE a.type = 'guest_parking' 
          AND b.status IN ('pending', 'confirmed')
          GROUP BY b.amenityId, b.bookingDate
        )
        AND status IN ('pending', 'confirmed')
        AND amenityId IN (SELECT id FROM amenities WHERE type = 'guest_parking')
      `, (err) => {
        if (err) {
          console.error('❌ Error cleaning up guest parking duplicates:', err);
        } else {
          console.log('✅ Duplicate guest parking bookings cleaned up');
        }
      });

      // 3. Show summary of remaining bookings
      db.get(`
        SELECT COUNT(*) as totalBookings,
               COUNT(DISTINCT userId || amenityId || bookingDate) as uniqueUserBookings,
               COUNT(DISTINCT amenityId || bookingDate) as uniqueSlotBookings
        FROM bookings 
        WHERE status IN ('pending', 'confirmed')
      `, (err, row) => {
        if (err) {
          console.error('❌ Error getting booking summary:', err);
        } else {
          console.log(`\n📊 Booking Summary after cleanup:`);
          console.log(`Total bookings: ${row.totalBookings}`);
          console.log(`Unique user-amenity-date combinations: ${row.uniqueUserBookings}`);
          console.log(`Unique amenity-date combinations: ${row.uniqueSlotBookings}`);
        }
      });

      // Commit transaction
      setTimeout(() => {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Error committing transaction:', err);
            db.run('ROLLBACK');
          } else {
            console.log('\n✅ Duplicate bookings cleanup completed successfully!');
            console.log('\n🔒 Now you can run the constraints script to prevent future duplicates.');
          }
          db.close();
        });
      }, 2000); // Wait for all operations to complete
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

cleanupDuplicateBookings();
