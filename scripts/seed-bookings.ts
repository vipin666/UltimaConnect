import sqlite3 from 'sqlite3';

async function seedBookings() {
  console.log('Seeding bookings to simulate unavailable slots...');
  
  const db = new sqlite3.Database('./tower-connect.db');
  
  // Get some users and amenities first
  const users = await new Promise<any[]>((resolve, reject) => {
    db.all("SELECT id, username, firstName, lastName FROM users WHERE role = 'resident' LIMIT 10", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const amenities = await new Promise<any[]>((resolve, reject) => {
    db.all("SELECT id, name, type FROM amenities", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  if (users.length === 0) {
    console.log('No users found. Please run seed-residents first.');
    db.close();
    return;
  }

  if (amenities.length === 0) {
    console.log('No amenities found. Please run seed-amenities first.');
    db.close();
    return;
  }

  // Generate bookings for the next 7 days with various time slots
  const bookings = [];
  const today = new Date();
  
  // Create bookings for different scenarios
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const bookingDate = new Date(today);
    bookingDate.setDate(today.getDate() + dayOffset);
    const dateStr = bookingDate.toISOString().split('T')[0];

    // Swimming Pool - Book morning slots on even days
    if (dayOffset % 2 === 0) {
      bookings.push({
        id: `booking-${Date.now()}-swim-${dayOffset}-1`,
        userId: users[0]?.id,
        amenityId: amenities.find(a => a.type === 'swimming_pool')?.id,
        bookingDate: dateStr,
        startTime: '06:00',
        endTime: '07:00',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      bookings.push({
        id: `booking-${Date.now()}-swim-${dayOffset}-2`,
        userId: users[1]?.id,
        amenityId: amenities.find(a => a.type === 'swimming_pool')?.id,
        bookingDate: dateStr,
        startTime: '07:00',
        endTime: '08:00',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
    }

    // Gym - Book evening slots on odd days
    if (dayOffset % 2 === 1) {
      bookings.push({
        id: `booking-${Date.now()}-gym-${dayOffset}-1`,
        userId: users[2]?.id,
        amenityId: amenities.find(a => a.type === 'gym')?.id,
        bookingDate: dateStr,
        startTime: '17:00',
        endTime: '19:00',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      bookings.push({
        id: `booking-${Date.now()}-gym-${dayOffset}-2`,
        userId: users[3]?.id,
        amenityId: amenities.find(a => a.type === 'gym')?.id,
        bookingDate: dateStr,
        startTime: '19:00',
        endTime: '21:00',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
    }

    // Community Hall - Book full day on weekends (day 5 and 6)
    if (dayOffset >= 5) {
      bookings.push({
        id: `booking-${Date.now()}-hall-${dayOffset}`,
        userId: users[4]?.id,
        amenityId: amenities.find(a => a.type === 'community_hall')?.id,
        bookingDate: dateStr,
        startTime: '00:00',
        endTime: '23:59',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
    }

    // Garden - Book afternoon slots on day 3
    if (dayOffset === 3) {
      bookings.push({
        id: `booking-${Date.now()}-garden-${dayOffset}-1`,
        userId: users[5]?.id,
        amenityId: amenities.find(a => a.type === 'garden')?.id,
        bookingDate: dateStr,
        startTime: '12:00',
        endTime: '13:00',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      bookings.push({
        id: `booking-${Date.now()}-garden-${dayOffset}-2`,
        userId: users[6]?.id,
        amenityId: amenities.find(a => a.type === 'garden')?.id,
        bookingDate: dateStr,
        startTime: '13:00',
        endTime: '14:00',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });

      bookings.push({
        id: `booking-${Date.now()}-garden-${dayOffset}-3`,
        userId: users[7]?.id,
        amenityId: amenities.find(a => a.type === 'garden')?.id,
        bookingDate: dateStr,
        startTime: '14:00',
        endTime: '15:00',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      });
    }

    // Pool Table - Book multiple slots on day 2
    if (dayOffset === 2) {
      for (let hour = 10; hour < 16; hour++) {
        bookings.push({
          id: `booking-${Date.now()}-pool-${dayOffset}-${hour}`,
          userId: users[hour % users.length]?.id,
          amenityId: amenities.find(a => a.type === 'pool_table')?.id,
          bookingDate: dateStr,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO bookings (id, userId, amenityId, bookingDate, startTime, endTime, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let successCount = 0;
      let errorCount = 0;

      bookings.forEach(booking => {
        stmt.run(
          booking.id,
          booking.userId,
          booking.amenityId,
          booking.bookingDate,
          booking.startTime,
          booking.endTime,
          booking.status,
          booking.createdAt,
          (err) => {
            if (err) {
              console.error(`Error creating booking: ${err.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          }
        );
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing bookings:', err);
          reject(err);
        } else {
          console.log(`✅ Successfully created: ${successCount} bookings`);
          if (errorCount > 0) {
            console.log(`❌ Failed to create: ${errorCount} bookings`);
          }
          
          // Show summary of what was created
          console.log('\n📊 Booking Summary:');
          console.log('Swimming Pool: Morning slots booked on even days');
          console.log('Gym: Evening slots booked on odd days');
          console.log('Community Hall: Full day booked on weekends');
          console.log('Garden: Afternoon slots booked on day 3');
          console.log('Pool Table: Multiple slots booked on day 2');
          console.log('\n🎉 Booking simulation complete!');
          resolve(true);
        }
        db.close();
      });
    });
  });
}

seedBookings().catch(console.error);
