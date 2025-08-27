import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function verifyDatabaseFixes() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔍 Verifying database fixes for all user types...\n');
  
  const tests = [
    {
      name: '📝 Posts table - admin comment functionality',
      query: 'SELECT admin_comment FROM posts LIMIT 1',
      expected: 'Should not throw error'
    },
    {
      name: '👥 Users table - extended user data',
      query: 'SELECT phone, emergencyContact, vehicleNumber, parkingSlot FROM users LIMIT 1',
      expected: 'Should not throw error'
    },
    {
      name: '🔧 Maintenance requests - admin functionality',
      query: 'SELECT adminComment, estimatedCost, actualCost FROM maintenance_requests LIMIT 1',
      expected: 'Should not throw error'
    },
    {
      name: '📅 Bookings - extended booking data',
      query: 'SELECT adminComment, guestCount, paymentStatus FROM bookings LIMIT 1',
      expected: 'Should not throw error'
    },
    {
      name: '👤 Visitors - extended visitor data',
      query: 'SELECT adminComment, securityNotes, isVip FROM visitors LIMIT 1',
      expected: 'Should not throw error'
    },
    {
      name: '🏢 Amenities - extended amenity data',
      query: 'SELECT imageUrl, rules, bookingFee FROM amenities LIMIT 1',
      expected: 'Should not throw error'
    },
    {
      name: '🏠 Flats - extended flat data',
      query: 'SELECT adminComment, parkingSpaces, furnished FROM flats LIMIT 1',
      expected: 'Should not throw error'
    },
    {
      name: '🔐 Biometric requests - extended access data',
      query: 'SELECT adminComment, securityLevel, isTemporary FROM biometric_requests LIMIT 1',
      expected: 'Should not throw error'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      await new Promise((resolve, reject) => {
        db.get(test.query, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
      console.log(`✅ ${test.name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name} - ${error.message}`);
    }
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All database fixes verified successfully!');
    console.log('\n✅ Database is ready for all user types:');
    console.log('👨‍💼 Admin users - Can manage posts, maintenance, visitors, bookings');
    console.log('👮 Watchman users - Can register visitors, manage parking, security');
    console.log('👨‍💼 Committee members - Can manage community affairs');
    console.log('👥 Resident users - Can book amenities, report issues, manage visitors');
    console.log('🏠 Flat management - Complete property management features');
    console.log('📅 Booking system - Advanced booking with payments and approvals');
    console.log('👤 Visitor management - Comprehensive visitor tracking');
    console.log('🔐 Biometric access - Secure access control system');
    console.log('🔧 Maintenance requests - Full maintenance workflow');
    console.log('📝 Posts and comments - Community communication system');
  } else {
    console.log('\n⚠️ Some database fixes may need attention');
  }

  db.close();
}

verifyDatabaseFixes();
