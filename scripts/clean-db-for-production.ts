import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function cleanDatabaseForProduction() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🧹 Cleaning database for production deployment...\n');
  
  db.serialize(() => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // Clear bookings
      db.run('DELETE FROM bookings', (err) => {
        if (err) {
          console.error('❌ Error clearing bookings:', err);
        } else {
          console.log('✅ Cleared all bookings');
        }
      });
      
      // Clear posts
      db.run('DELETE FROM posts', (err) => {
        if (err) {
          console.error('❌ Error clearing posts:', err);
        } else {
          console.log('✅ Cleared all posts');
        }
      });
      
      // Clear comments
      db.run('DELETE FROM comments', (err) => {
        if (err) {
          console.error('❌ Error clearing comments:', err);
        } else {
          console.log('✅ Cleared all comments');
        }
      });
      
      // Clear post likes
      db.run('DELETE FROM post_likes', (err) => {
        if (err) {
          console.error('❌ Error clearing post likes:', err);
        } else {
          console.log('✅ Cleared all post likes');
        }
      });
      
      // Clear visitors
      db.run('DELETE FROM visitors', (err) => {
        if (err) {
          console.error('❌ Error clearing visitors:', err);
        } else {
          console.log('✅ Cleared all visitors');
        }
      });
      
      // Clear biometric requests
      db.run('DELETE FROM biometric_requests', (err) => {
        if (err) {
          console.error('❌ Error clearing biometric requests:', err);
        } else {
          console.log('✅ Cleared all biometric requests');
        }
      });
      
      // Clear maintenance requests
      db.run('DELETE FROM maintenance_requests', (err) => {
        if (err) {
          console.error('❌ Error clearing maintenance requests:', err);
        } else {
          console.log('✅ Cleared all maintenance requests');
        }
      });
      
      // Clear flat documents
      db.run('DELETE FROM flat_documents', (err) => {
        if (err) {
          console.error('❌ Error clearing flat documents:', err);
        } else {
          console.log('✅ Cleared all flat documents');
        }
      });
      
      // Clear tenant documents
      db.run('DELETE FROM tenant_documents', (err) => {
        if (err) {
          console.error('❌ Error clearing tenant documents:', err);
        } else {
          console.log('✅ Cleared all tenant documents');
        }
      });
      
      // Clear fee transactions
      db.run('DELETE FROM fee_transactions', (err) => {
        if (err) {
          console.error('❌ Error clearing fee transactions:', err);
        } else {
          console.log('✅ Cleared all fee transactions');
        }
      });
      
      // Clear payments
      db.run('DELETE FROM payments', (err) => {
        if (err) {
          console.error('❌ Error clearing payments:', err);
        } else {
          console.log('✅ Cleared all payments');
        }
      });
      
      // Clear notifications
      db.run('DELETE FROM notifications', (err) => {
        if (err) {
          console.error('❌ Error clearing notifications:', err);
        } else {
          console.log('✅ Cleared all notifications');
        }
      });
      
      // Clear guest notifications
      db.run('DELETE FROM guest_notifications', (err) => {
        if (err) {
          console.error('❌ Error clearing guest notifications:', err);
        } else {
          console.log('✅ Cleared all guest notifications');
        }
      });
      
      // Clear visitor notifications
      db.run('DELETE FROM visitor_notifications', (err) => {
        if (err) {
          console.error('❌ Error clearing visitor notifications:', err);
        } else {
          console.log('✅ Cleared all visitor notifications');
        }
      });
      
      // Clear messages
      db.run('DELETE FROM messages', (err) => {
        if (err) {
          console.error('❌ Error clearing messages:', err);
        } else {
          console.log('✅ Cleared all messages');
        }
      });
      
      // Clear announcements
      db.run('DELETE FROM announcements', (err) => {
        if (err) {
          console.error('❌ Error clearing announcements:', err);
        } else {
          console.log('✅ Cleared all announcements');
        }
      });
      
      // Clear fee types
      db.run('DELETE FROM fee_types', (err) => {
        if (err) {
          console.error('❌ Error clearing fee types:', err);
        } else {
          console.log('✅ Cleared all fee types');
        }
      });
      
      // Clear fee schedules
      db.run('DELETE FROM fee_schedules', (err) => {
        if (err) {
          console.error('❌ Error clearing fee schedules:', err);
        } else {
          console.log('✅ Cleared all fee schedules');
        }
      });
      
      // Clear payment schedules
      db.run('DELETE FROM payment_schedules', (err) => {
        if (err) {
          console.error('❌ Error clearing payment schedules:', err);
        } else {
          console.log('✅ Cleared all payment schedules');
        }
      });
      
      // Clear payment notifications
      db.run('DELETE FROM payment_notifications', (err) => {
        if (err) {
          console.error('❌ Error clearing payment notifications:', err);
        } else {
          console.log('✅ Cleared all payment notifications');
        }
      });
      
      // Clear defaulter tracking
      db.run('DELETE FROM defaulter_tracking', (err) => {
        if (err) {
          console.error('❌ Error clearing defaulter tracking:', err);
        } else {
          console.log('✅ Cleared all defaulter tracking');
        }
      });
      
      // Commit transaction
      setTimeout(() => {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Error committing transaction:', err);
            db.run('ROLLBACK');
          } else {
            console.log('\n✅ Database cleaned successfully!');
            console.log('\n📊 Current database status:');
            
            // Check what data remains
            db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
              if (err) {
                console.error('❌ Error counting users:', err);
              } else {
                console.log(`👥 Users: ${rows[0].count}`);
              }
            });
            
            db.all('SELECT COUNT(*) as count FROM flats', (err, rows) => {
              if (err) {
                console.error('❌ Error counting flats:', err);
              } else {
                console.log(`🏠 Flats: ${rows[0].count}`);
              }
            });
            
            db.all('SELECT COUNT(*) as count FROM amenities', (err, rows) => {
              if (err) {
                console.error('❌ Error counting amenities:', err);
              } else {
                console.log(`🏊 Amenities: ${rows[0].count}`);
              }
            });
            
            db.all('SELECT COUNT(*) as count FROM committee_members', (err, rows) => {
              if (err) {
                console.error('❌ Error counting committee members:', err);
              } else {
                console.log(`👨‍💼 Committee Members: ${rows[0].count}`);
              }
            });
            
            console.log('\n🚀 Database is ready for production deployment!');
            console.log('📝 Note: All user data, flats, amenities, and committee members are preserved.');
          }
          db.close();
        });
      }, 2000); // Wait for all DELETE operations to complete
      
    } catch (error) {
      console.error('❌ Error during database cleanup:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

cleanDatabaseForProduction().catch(console.error);
