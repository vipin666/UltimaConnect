import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function fixMissingColumns() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔧 Fixing missing database columns...\n');
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Fix posts table - add admin_comment column
      console.log('📝 Fixing posts table...');
      db.run(`
        ALTER TABLE posts ADD COLUMN admin_comment TEXT
      `, (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('✅ admin_comment column already exists in posts table');
          } else {
            console.error('❌ Error adding admin_comment to posts:', err);
          }
        } else {
          console.log('✅ admin_comment column added to posts table');
        }
      });

      // 2. Fix users table - add missing columns
      console.log('👥 Fixing users table...');
      const userColumns = [
        { name: 'phone', type: 'TEXT' },
        { name: 'dateOfBirth', type: 'DATE' },
        { name: 'emergencyContact', type: 'TEXT' },
        { name: 'emergencyPhone', type: 'TEXT' },
        { name: 'occupation', type: 'TEXT' },
        { name: 'familyMembers', type: 'INTEGER DEFAULT 0' },
        { name: 'vehicleNumber', type: 'TEXT' },
        { name: 'parkingSlot', type: 'TEXT' },
        { name: 'moveInDate', type: 'DATE' },
        { name: 'leaseEndDate', type: 'DATE' },
        { name: 'rentAmount', type: 'REAL' },
        { name: 'maintenanceContact', type: 'TEXT' },
        { name: 'preferences', type: 'TEXT' }, // JSON string for user preferences
        { name: 'lastLoginAt', type: 'DATETIME' },
        { name: 'loginCount', type: 'INTEGER DEFAULT 0' },
        { name: 'isVerified', type: 'BOOLEAN DEFAULT false' },
        { name: 'verificationToken', type: 'TEXT' },
        { name: 'verificationExpiresAt', type: 'DATETIME' }
      ];

      userColumns.forEach(column => {
        db.run(`
          ALTER TABLE users ADD COLUMN ${column.name} ${column.type}
        `, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log(`✅ ${column.name} column already exists in users table`);
            } else {
              console.error(`❌ Error adding ${column.name} to users:`, err);
            }
          } else {
            console.log(`✅ ${column.name} column added to users table`);
          }
        });
      });

      // 3. Fix maintenance_requests table - add missing columns
      console.log('🔧 Fixing maintenance_requests table...');
      const maintenanceColumns = [
        { name: 'adminComment', type: 'TEXT' },
        { name: 'assignedDate', type: 'DATETIME' },
        { name: 'completedDate', type: 'DATETIME' },
        { name: 'estimatedCost', type: 'REAL' },
        { name: 'actualCost', type: 'REAL' },
        { name: 'priority', type: 'TEXT DEFAULT "medium"' },
        { name: 'category', type: 'TEXT' },
        { name: 'location', type: 'TEXT' },
        { name: 'photos', type: 'TEXT' }, // JSON string for photo URLs
        { name: 'isUrgent', type: 'BOOLEAN DEFAULT false' },
        { name: 'scheduledDate', type: 'DATETIME' },
        { name: 'completionNotes', type: 'TEXT' }
      ];

      maintenanceColumns.forEach(column => {
        db.run(`
          ALTER TABLE maintenance_requests ADD COLUMN ${column.name} ${column.type}
        `, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log(`✅ ${column.name} column already exists in maintenance_requests table`);
            } else {
              console.error(`❌ Error adding ${column.name} to maintenance_requests:`, err);
            }
          } else {
            console.log(`✅ ${column.name} column added to maintenance_requests table`);
          }
        });
      });

      // 4. Fix bookings table - add missing columns
      console.log('📅 Fixing bookings table...');
      const bookingColumns = [
        { name: 'adminComment', type: 'TEXT' },
        { name: 'cancellationReason', type: 'TEXT' },
        { name: 'cancelledBy', type: 'TEXT' },
        { name: 'cancelledAt', type: 'DATETIME' },
        { name: 'guestCount', type: 'INTEGER DEFAULT 1' },
        { name: 'specialRequirements', type: 'TEXT' },
        { name: 'paymentStatus', type: 'TEXT DEFAULT "pending"' },
        { name: 'paymentAmount', type: 'REAL' },
        { name: 'paymentMethod', type: 'TEXT' },
        { name: 'isRecurring', type: 'BOOLEAN DEFAULT false' },
        { name: 'recurrencePattern', type: 'TEXT' }, // JSON string for recurrence
        { name: 'endDate', type: 'DATE' } // for recurring bookings
      ];

      bookingColumns.forEach(column => {
        db.run(`
          ALTER TABLE bookings ADD COLUMN ${column.name} ${column.type}
        `, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log(`✅ ${column.name} column already exists in bookings table`);
            } else {
              console.error(`❌ Error adding ${column.name} to bookings:`, err);
            }
          } else {
            console.log(`✅ ${column.name} column added to bookings table`);
          }
        });
      });

      // 5. Fix visitors table - add missing columns
      console.log('👤 Fixing visitors table...');
      const visitorColumns = [
        { name: 'arrivalTime', type: 'DATETIME' },
        { name: 'departureTime', type: 'DATETIME' },
        { name: 'adminComment', type: 'TEXT' },
        { name: 'securityNotes', type: 'TEXT' },
        { name: 'isVip', type: 'BOOLEAN DEFAULT false' },
        { name: 'specialInstructions', type: 'TEXT' },
        { name: 'hostSignature', type: 'TEXT' },
        { name: 'visitorSignature', type: 'TEXT' },
        { name: 'temperature', type: 'REAL' }, // for health screening
        { name: 'healthDeclaration', type: 'BOOLEAN DEFAULT false' },
        { name: 'covidScreening', type: 'BOOLEAN DEFAULT false' },
        { name: 'maskWearing', type: 'BOOLEAN DEFAULT true' },
        { name: 'sanitizationDone', type: 'BOOLEAN DEFAULT false' }
      ];

      visitorColumns.forEach(column => {
        db.run(`
          ALTER TABLE visitors ADD COLUMN ${column.name} ${column.type}
        `, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log(`✅ ${column.name} column already exists in visitors table`);
            } else {
              console.error(`❌ Error adding ${column.name} to visitors:`, err);
            }
          } else {
            console.log(`✅ ${column.name} column added to visitors table`);
          }
        });
      });

      // 6. Fix amenities table - add missing columns
      console.log('🏢 Fixing amenities table...');
      const amenityColumns = [
        { name: 'imageUrl', type: 'TEXT' },
        { name: 'rules', type: 'TEXT' },
        { name: 'maintenanceSchedule', type: 'TEXT' },
        { name: 'bookingFee', type: 'REAL DEFAULT 0' },
        { name: 'maxBookingDuration', type: 'INTEGER' }, // in hours
        { name: 'advanceBookingDays', type: 'INTEGER DEFAULT 7' },
        { name: 'isBookable', type: 'BOOLEAN DEFAULT true' },
        { name: 'requiresApproval', type: 'BOOLEAN DEFAULT false' },
        { name: 'adminNotes', type: 'TEXT' },
        { name: 'lastMaintenance', type: 'DATETIME' },
        { name: 'nextMaintenance', type: 'DATETIME' },
        { name: 'operatingHours', type: 'TEXT' }, // JSON string for hours
        { name: 'location', type: 'TEXT' },
        { name: 'contactPerson', type: 'TEXT' },
        { name: 'contactPhone', type: 'TEXT' }
      ];

      amenityColumns.forEach(column => {
        db.run(`
          ALTER TABLE amenities ADD COLUMN ${column.name} ${column.type}
        `, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log(`✅ ${column.name} column already exists in amenities table`);
            } else {
              console.error(`❌ Error adding ${column.name} to amenities:`, err);
            }
          } else {
            console.log(`✅ ${column.name} column added to amenities table`);
          }
        });
      });

      // 7. Fix flats table - add missing columns
      console.log('🏠 Fixing flats table...');
      const flatColumns = [
        { name: 'adminComment', type: 'TEXT' },
        { name: 'maintenanceHistory', type: 'TEXT' }, // JSON string
        { name: 'lastInspection', type: 'DATETIME' },
        { name: 'nextInspection', type: 'DATETIME' },
        { name: 'amenities', type: 'TEXT' }, // JSON string for flat amenities
        { name: 'parkingSpaces', type: 'INTEGER DEFAULT 1' },
        { name: 'storageUnits', type: 'INTEGER DEFAULT 0' },
        { name: 'balcony', type: 'BOOLEAN DEFAULT false' },
        { name: 'garden', type: 'BOOLEAN DEFAULT false' },
        { name: 'furnished', type: 'BOOLEAN DEFAULT false' },
        { name: 'petAllowed', type: 'BOOLEAN DEFAULT false' },
        { name: 'smokingAllowed', type: 'BOOLEAN DEFAULT false' },
        { name: 'utilitiesIncluded', type: 'BOOLEAN DEFAULT false' },
        { name: 'securityDeposit', type: 'REAL' },
        { name: 'monthlyMaintenance', type: 'REAL' },
        { name: 'propertyTax', type: 'REAL' },
        { name: 'insurance', type: 'REAL' },
        { name: 'totalMonthlyCost', type: 'REAL' }
      ];

      flatColumns.forEach(column => {
        db.run(`
          ALTER TABLE flats ADD COLUMN ${column.name} ${column.type}
        `, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log(`✅ ${column.name} column already exists in flats table`);
            } else {
              console.error(`❌ Error adding ${column.name} to flats:`, err);
            }
          } else {
            console.log(`✅ ${column.name} column added to flats table`);
          }
        });
      });

      // 8. Fix biometric_requests table - add missing columns
      console.log('🔐 Fixing biometric_requests table...');
      const biometricColumns = [
        { name: 'adminComment', type: 'TEXT' },
        { name: 'rejectionReason', type: 'TEXT' },
        { name: 'requestedAccessAreas', type: 'TEXT' }, // JSON string
        { name: 'approvedAccessAreas', type: 'TEXT' }, // JSON string
        { name: 'biometricData', type: 'TEXT' }, // encrypted biometric data
        { name: 'isTemporary', type: 'BOOLEAN DEFAULT false' },
        { name: 'temporaryStartDate', type: 'DATETIME' },
        { name: 'temporaryEndDate', type: 'DATETIME' },
        { name: 'emergencyContact', type: 'TEXT' },
        { name: 'emergencyPhone', type: 'TEXT' },
        { name: 'specialInstructions', type: 'TEXT' },
        { name: 'securityLevel', type: 'TEXT DEFAULT "standard"' },
        { name: 'requiresEscort', type: 'BOOLEAN DEFAULT false' },
        { name: 'escortUserId', type: 'TEXT' },
        { name: 'lastUsed', type: 'DATETIME' },
        { name: 'usageCount', type: 'INTEGER DEFAULT 0' }
      ];

      biometricColumns.forEach(column => {
        db.run(`
          ALTER TABLE biometric_requests ADD COLUMN ${column.name} ${column.type}
        `, (err) => {
          if (err) {
            if (err.message.includes('duplicate column name')) {
              console.log(`✅ ${column.name} column already exists in biometric_requests table`);
            } else {
              console.error(`❌ Error adding ${column.name} to biometric_requests:`, err);
            }
          } else {
            console.log(`✅ ${column.name} column added to biometric_requests table`);
          }
        });
      });

      // Commit transaction
      setTimeout(() => {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Error committing transaction:', err);
            db.run('ROLLBACK');
          } else {
            console.log('\n✅ All missing columns have been added successfully!');
            console.log('\n🔧 Database is now ready for all user types:');
            console.log('👨‍💼 Admin users');
            console.log('👮 Watchman users');
            console.log('👨‍💼 Committee members (caretaker, secretary, president, treasurer)');
            console.log('👥 Resident users');
            console.log('🏠 Flat management');
            console.log('📅 Booking system');
            console.log('👤 Visitor management');
            console.log('🔐 Biometric access');
            console.log('🔧 Maintenance requests');
            console.log('📝 Posts and comments');
          }
          db.close();
        });
      }, 3000); // Wait for all operations to complete
      
    } catch (error) {
      console.error('❌ Error during column fix:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

fixMissingColumns();
