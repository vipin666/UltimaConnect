import sqlite3 from 'sqlite3';
import path from 'path';
import { connectDatabase } from '../server/config/database';
import { mongoStorage } from '../server/services/mongoStorage';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

console.log('🔄 Starting migration from SQLite to MongoDB...\n');

async function migrateToMongoDB() {
  // Connect to MongoDB
  await connectDatabase();
  console.log('✅ Connected to MongoDB');

  // Connect to SQLite
  const sqlite = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    sqlite.serialize(async () => {
      try {
        console.log('📊 Starting data migration...\n');

        // Migrate Users
        console.log('👥 Migrating users...');
        sqlite.all('SELECT * FROM users', async (err, users) => {
          if (err) {
            console.error('❌ Error fetching users:', err);
            reject(err);
            return;
          }

          for (const user of users) {
            try {
              await mongoStorage.createUser({
                username: user.username,
                password: user.password, // Already hashed
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                unitNumber: user.unitNumber,
                phone: user.phone
              });
              console.log(`✅ Migrated user: ${user.username}`);
            } catch (error) {
              console.log(`⚠️ User ${user.username} already exists or error:`, error);
            }
          }

          // Migrate Flats
          console.log('\n🏠 Migrating flats...');
          sqlite.all('SELECT * FROM flats', async (err, flats) => {
            if (err) {
              console.error('❌ Error fetching flats:', err);
              reject(err);
              return;
            }

            for (const flat of flats) {
              try {
                await mongoStorage.createFlat({
                  flatNumber: flat.flatNumber,
                  unitNumber: flat.unitNumber,
                  floor: flat.floor,
                  type: flat.type,
                  size: flat.size,
                  isOccupied: flat.isOccupied === 1,
                  isRented: flat.isRented === 1,
                  assignedUserId: flat.assignedUserId
                });
                console.log(`✅ Migrated flat: ${flat.flatNumber}`);
              } catch (error) {
                console.log(`⚠️ Flat ${flat.flatNumber} already exists or error:`, error);
              }
            }

            // Migrate Amenities
            console.log('\n🏢 Migrating amenities...');
            sqlite.all('SELECT * FROM amenities', async (err, amenities) => {
              if (err) {
                console.error('❌ Error fetching amenities:', err);
                reject(err);
                return;
              }

              for (const amenity of amenities) {
                try {
                  await mongoStorage.createAmenity({
                    name: amenity.name,
                    type: amenity.type,
                    description: amenity.description,
                    isActive: amenity.isActive === 1,
                    maxCapacity: amenity.maxCapacity,
                    bookingDuration: amenity.bookingDuration
                  });
                  console.log(`✅ Migrated amenity: ${amenity.name}`);
                } catch (error) {
                  console.log(`⚠️ Amenity ${amenity.name} already exists or error:`, error);
                }
              }

              // Migrate Posts
              console.log('\n📝 Migrating posts...');
              sqlite.all('SELECT * FROM posts', async (err, posts) => {
                if (err) {
                  console.error('❌ Error fetching posts:', err);
                  reject(err);
                  return;
                }

                for (const post of posts) {
                  try {
                    await mongoStorage.createPost({
                      title: post.title,
                      content: post.content,
                      type: post.type,
                      status: post.status,
                      authorId: post.authorId,
                      adminComment: post.adminComment
                    });
                    console.log(`✅ Migrated post: ${post.title}`);
                  } catch (error) {
                    console.log(`⚠️ Post ${post.title} already exists or error:`, error);
                  }
                }

                // Migrate Comments
                console.log('\n💬 Migrating comments...');
                sqlite.all('SELECT * FROM comments', async (err, comments) => {
                  if (err) {
                    console.error('❌ Error fetching comments:', err);
                    reject(err);
                    return;
                  }

                  for (const comment of comments) {
                    try {
                      await mongoStorage.createComment({
                        content: comment.content,
                        postId: comment.postId,
                        authorId: comment.authorId
                      });
                      console.log(`✅ Migrated comment: ${comment.content.substring(0, 30)}...`);
                    } catch (error) {
                      console.log(`⚠️ Comment already exists or error:`, error);
                    }
                  }

                  // Migrate Post Likes
                  console.log('\n👍 Migrating post likes...');
                  sqlite.all('SELECT * FROM post_likes', async (err, likes) => {
                    if (err) {
                      console.error('❌ Error fetching post likes:', err);
                      reject(err);
                      return;
                    }

                    for (const like of likes) {
                      try {
                        await mongoStorage.likePost(like.postId, like.userId);
                        console.log(`✅ Migrated like for post: ${like.postId}`);
                      } catch (error) {
                        console.log(`⚠️ Like already exists or error:`, error);
                      }
                    }

                    // Migrate Bookings
                    console.log('\n📅 Migrating bookings...');
                    sqlite.all('SELECT * FROM bookings', async (err, bookings) => {
                      if (err) {
                        console.error('❌ Error fetching bookings:', err);
                        reject(err);
                        return;
                      }

                      for (const booking of bookings) {
                        try {
                          await mongoStorage.createBooking({
                            userId: booking.userId,
                            amenityId: booking.amenityId,
                            bookingDate: new Date(booking.bookingDate),
                            startTime: booking.startTime,
                            endTime: booking.endTime,
                            status: booking.status,
                            guestParkingSlot: booking.guestParkingSlot,
                            adminComment: booking.adminComment
                          });
                          console.log(`✅ Migrated booking: ${booking.id}`);
                        } catch (error) {
                          console.log(`⚠️ Booking already exists or error:`, error);
                        }
                      }

                      // Migrate Visitors
                      console.log('\n👤 Migrating visitors...');
                      sqlite.all('SELECT * FROM visitors', async (err, visitors) => {
                        if (err) {
                          console.error('❌ Error fetching visitors:', err);
                          reject(err);
                          return;
                        }

                        for (const visitor of visitors) {
                          try {
                            await mongoStorage.createVisitor({
                              name: visitor.name,
                              phone: visitor.phone,
                              purpose: visitor.purpose,
                              unitToVisit: visitor.unitToVisit,
                              hostUserId: visitor.hostUserId,
                              arrivalTime: visitor.arrivalTime,
                              departureTime: visitor.departureTime,
                              guestParkingSlot: visitor.guestParkingSlot,
                              status: visitor.status
                            });
                            console.log(`✅ Migrated visitor: ${visitor.name}`);
                          } catch (error) {
                            console.log(`⚠️ Visitor already exists or error:`, error);
                          }
                        }

                        // Migrate Biometric Requests
                        console.log('\n🔐 Migrating biometric requests...');
                        sqlite.all('SELECT * FROM biometric_requests', async (err, requests) => {
                          if (err) {
                            console.error('❌ Error fetching biometric requests:', err);
                            reject(err);
                            return;
                          }

                          for (const request of requests) {
                            try {
                              await mongoStorage.createBiometricRequest({
                                userId: request.userId,
                                biometricId: request.biometricId,
                                status: request.status
                              });
                              console.log(`✅ Migrated biometric request: ${request.id}`);
                            } catch (error) {
                              console.log(`⚠️ Biometric request already exists or error:`, error);
                            }
                          }

                          console.log('\n🎉 Migration completed successfully!');
                          console.log('📋 Summary:');
                          console.log(`   - Users: ${users.length}`);
                          console.log(`   - Flats: ${flats.length}`);
                          console.log(`   - Amenities: ${amenities.length}`);
                          console.log(`   - Posts: ${posts.length}`);
                          console.log(`   - Comments: ${comments.length}`);
                          console.log(`   - Post Likes: ${likes.length}`);
                          console.log(`   - Bookings: ${bookings.length}`);
                          console.log(`   - Visitors: ${visitors.length}`);
                          console.log(`   - Biometric Requests: ${requests.length}`);

                          sqlite.close();
                          resolve(true);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      } catch (error) {
        console.error('❌ Migration failed:', error);
        sqlite.close();
        reject(error);
      }
    });
  });
}

migrateToMongoDB()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
