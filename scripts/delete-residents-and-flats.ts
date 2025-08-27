import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function deleteResidentsAndFlats() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🗑️ Deleting all residents and flats from database...\n');
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. First, let's see what we're about to delete
      console.log('📊 Current data summary:');
      
      db.get('SELECT COUNT(*) as count FROM users WHERE role = "resident"', (err, row) => {
        if (err) {
          console.error('❌ Error counting residents:', err);
        } else {
          console.log(`👥 Residents: ${row.count}`);
        }
      });
      
      db.get('SELECT COUNT(*) as count FROM flats', (err, row) => {
        if (err) {
          console.error('❌ Error counting flats:', err);
        } else {
          console.log(`🏢 Flats: ${row.count}`);
        }
      });
      
             // 2. Delete all residents (users with role = 'resident') - preserve other roles
       console.log('\n🗑️ Deleting all residents (preserving other roles)...');
       db.run(`
         DELETE FROM users 
         WHERE role = 'resident'
       `, (err) => {
         if (err) {
           console.error('❌ Error deleting residents:', err);
         } else {
           console.log('✅ All residents deleted successfully');
         }
       });

      // 3. Delete all flats
      console.log('🗑️ Deleting all flats...');
      db.run(`
        DELETE FROM flats
      `, (err) => {
        if (err) {
          console.error('❌ Error deleting flats:', err);
        } else {
          console.log('✅ All flats deleted successfully');
        }
      });

             // 4. Also delete related data that depends on residents (only resident data)
       console.log('🗑️ Cleaning up resident-related data...');
      
      // Delete visitor registrations by residents
      db.run(`
        DELETE FROM visitors 
        WHERE hostUserId IN (
          SELECT id FROM users WHERE role = 'resident'
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error deleting visitor registrations:', err);
        } else {
          console.log('✅ Visitor registrations by residents deleted');
        }
      });

      // Delete bookings by residents
      db.run(`
        DELETE FROM bookings 
        WHERE userId IN (
          SELECT id FROM users WHERE role = 'resident'
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error deleting bookings by residents:', err);
        } else {
          console.log('✅ Bookings by residents deleted');
        }
      });

      // Delete posts by residents
      db.run(`
        DELETE FROM posts 
        WHERE authorId IN (
          SELECT id FROM users WHERE role = 'resident'
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error deleting posts by residents:', err);
        } else {
          console.log('✅ Posts by residents deleted');
        }
      });

      // Delete comments by residents
      db.run(`
        DELETE FROM comments 
        WHERE authorId IN (
          SELECT id FROM users WHERE role = 'resident'
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error deleting comments by residents:', err);
        } else {
          console.log('✅ Comments by residents deleted');
        }
      });

      // Delete maintenance requests by residents
      db.run(`
        DELETE FROM maintenance_requests 
        WHERE userId IN (
          SELECT id FROM users WHERE role = 'resident'
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error deleting maintenance requests by residents:', err);
        } else {
          console.log('✅ Maintenance requests by residents deleted');
        }
      });

      // Delete biometric requests by residents
      db.run(`
        DELETE FROM biometric_requests 
        WHERE userId IN (
          SELECT id FROM users WHERE role = 'resident'
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error deleting biometric requests by residents:', err);
        } else {
          console.log('✅ Biometric requests by residents deleted');
        }
      });

      // 5. Show final summary
      setTimeout(() => {
        console.log('\n📊 Final data summary:');
        
        db.get('SELECT COUNT(*) as count FROM users WHERE role = "resident"', (err, row) => {
          if (err) {
            console.error('❌ Error counting remaining residents:', err);
          } else {
            console.log(`👥 Remaining residents: ${row.count}`);
          }
        });
        
        db.get('SELECT COUNT(*) as count FROM flats', (err, row) => {
          if (err) {
            console.error('❌ Error counting remaining flats:', err);
          } else {
            console.log(`🏢 Remaining flats: ${row.count}`);
          }
        });

        // Commit transaction
        setTimeout(() => {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('❌ Error committing transaction:', err);
              db.run('ROLLBACK');
            } else {
                           console.log('\n✅ All residents and flats deleted successfully!');
             console.log('\n🛡️ Preserved roles: admin, super_admin, president, treasurer, watchman, caretaker, staff, etc.');
             console.log('\n🚀 Database is now clean and ready for reseeding.');
             console.log('\n📝 Next steps:');
             console.log('1. Run your seeding script to add new residents and flats');
             console.log('2. Verify the data has been properly seeded');
            }
            db.close();
          });
        }, 1000);
        
      }, 2000); // Wait for all operations to complete
      
    } catch (error) {
      console.error('❌ Error during deletion:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

deleteResidentsAndFlats();
