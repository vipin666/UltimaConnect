import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function addBookingConstraints() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔒 Adding booking constraints to prevent duplicate bookings...\n');
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Add unique constraint to prevent same user booking same amenity on same date
      console.log('👤 Adding unique constraint for user-amenity-date combinations...');
      db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_amenity_date_unique 
        ON bookings (userId, amenityId, bookingDate) 
        WHERE status IN ('pending', 'confirmed')
      `, (err) => {
        if (err) {
          console.error('❌ Error adding unique constraint:', err);
        } else {
          console.log('✅ Unique constraint added for user-amenity-date combinations');
        }
      });

      // 2. Add unique constraint for guest parking slots (only one booking per slot per date)
      console.log('🅿️ Adding unique constraint for guest parking slots...');
      db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_parking_slot_unique 
        ON bookings (amenityId, bookingDate) 
        WHERE status IN ('pending', 'confirmed')
      `, (err) => {
        if (err) {
          console.error('❌ Error adding guest parking constraint:', err);
        } else {
          console.log('✅ Unique constraint added for guest parking slots');
        }
      });

      // 3. Add index for faster booking queries
      console.log('📊 Adding performance indexes...');
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_bookings_amenity_date 
        ON bookings (amenityId, bookingDate, status)
      `, (err) => {
        if (err) {
          console.error('❌ Error adding booking index:', err);
        } else {
          console.log('✅ Performance index added for bookings');
        }
      });

      // 4. Add index for user bookings
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_bookings_user 
        ON bookings (userId, status)
      `, (err) => {
        if (err) {
          console.error('❌ Error adding user booking index:', err);
        } else {
          console.log('✅ Performance index added for user bookings');
        }
      });

      // Commit transaction
      setTimeout(() => {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Error committing transaction:', err);
            db.run('ROLLBACK');
          } else {
            console.log('\n✅ All booking constraints added successfully!');
            console.log('\n🔒 Database now prevents:');
            console.log('👤 Same user booking same amenity on same date');
            console.log('🅿️ Multiple bookings for same guest parking slot on same date');
            console.log('📊 Improved query performance for booking operations');
            console.log('\n🚀 The booking system is now secure and prevents duplicate bookings!');
          }
          db.close();
        });
      }, 2000); // Wait for all operations to complete
      
    } catch (error) {
      console.error('❌ Error during constraint addition:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

addBookingConstraints();
