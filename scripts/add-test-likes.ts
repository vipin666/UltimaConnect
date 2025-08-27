import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

console.log('👍 Adding test likes to posts...\n');

async function addTestLikes() {
  const db = new sqlite3.Database(dbPath);
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // Get some users to add likes
      db.all('SELECT id, firstName, lastName, username FROM users WHERE role = "resident" LIMIT 5', (err, users) => {
        if (err) {
          console.error('❌ Error fetching users:', err);
          db.run('ROLLBACK');
          db.close();
          return;
        }
        
        if (users.length === 0) {
          console.log('⚠️ No users found to add likes');
          db.run('ROLLBACK');
          db.close();
          return;
        }
        
        // Get a post to add likes to
        db.get('SELECT id, title FROM posts ORDER BY createdAt DESC LIMIT 1', (err, post) => {
          if (err) {
            console.error('❌ Error fetching post:', err);
            db.run('ROLLBACK');
            db.close();
            return;
          }
          
          if (!post) {
            console.log('⚠️ No posts found to add likes to');
            db.run('ROLLBACK');
            db.close();
            return;
          }
          
          console.log(`📝 Adding likes to post: "${post.title}"`);
          
          let successCount = 0;
          let errorCount = 0;
          
          users.forEach((user, index) => {
            // Add a small delay to avoid duplicate timestamps
            setTimeout(() => {
              const likeId = `like-test-${Date.now()}-${index}`;
              
              db.run('INSERT OR IGNORE INTO post_likes (id, postId, userId) VALUES (?, ?, ?)', 
                [likeId, post.id, user.id], 
                (err) => {
                  if (err) {
                    console.error(`❌ Error adding like for ${user.firstName}:`, err);
                    errorCount++;
                  } else {
                    console.log(`✅ Added like from ${user.firstName} ${user.lastName} (${user.username})`);
                    successCount++;
                  }
                  
                  // Check if all likes have been processed
                  if (successCount + errorCount === users.length) {
                    setTimeout(() => {
                      console.log('\n📊 Test Likes Summary:');
                      console.log(`✅ Successfully added: ${successCount} likes`);
                      console.log(`❌ Errors: ${errorCount} likes`);
                      console.log(`📝 Post: "${post.title}"`);
                      
                      // Commit transaction
                      setTimeout(() => {
                        db.run('COMMIT', (err) => {
                          if (err) {
                            console.error('❌ Error committing transaction:', err);
                            db.run('ROLLBACK');
                          } else {
                            console.log('\n🎉 Test likes added successfully!');
                            console.log('🔍 You can now test the hover functionality on the like button');
                          }
                          db.close();
                        });
                      }, 1000);
                      
                    }, 2000);
                  }
                }
              );
            }, index * 100); // Small delay between each like
          });
        });
      });
      
    } catch (error) {
      console.error('❌ Error during test likes addition:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

addTestLikes();
