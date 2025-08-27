import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

console.log('🧪 Testing likes and comments functionality...\n');

function testLikesAndComments() {
  const db = new sqlite3.Database(dbPath);
  
  db.serialize(() => {
    // Test 1: Check posts with likes and comments counts
    console.log('📊 Test 1: Posts with likes and comments counts');
    db.all(`
      SELECT p.id, p.title, p.content, p.type, p.status, p.createdAt, 
             (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likesCount,
             (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentsCount,
             u.firstName, u.lastName, u.username
      FROM posts p 
      LEFT JOIN users u ON p.authorId = u.id
      ORDER BY p.createdAt DESC
      LIMIT 5
    `, (err, rows) => {
      if (err) {
        console.error('❌ Error fetching posts:', err);
      } else {
        console.log('📝 Posts with counts:');
        rows.forEach((post, index) => {
          console.log(`  ${index + 1}. Post ID: ${post.id}`);
          console.log(`     Title: ${post.title}`);
          console.log(`     Type: ${post.type}`);
          console.log(`     Status: ${post.status}`);
          console.log(`     Author: ${post.firstName} ${post.lastName} (${post.username})`);
          console.log(`     Likes: ${post.likesCount}`);
          console.log(`     Comments: ${post.commentsCount}`);
          console.log(`     Created: ${post.createdAt}`);
          console.log('');
        });
      }
    });
    
    // Test 2: Check post_likes table
    console.log('👍 Test 2: Post likes table');
    db.all('SELECT * FROM post_likes ORDER BY createdAt DESC LIMIT 5', (err, rows) => {
      if (err) {
        console.error('❌ Error fetching post likes:', err);
      } else {
        if (rows.length === 0) {
          console.log('📝 No likes found in database');
        } else {
          console.log('📝 Recent likes:');
          rows.forEach((like, index) => {
            console.log(`  ${index + 1}. Like ID: ${like.id}`);
            console.log(`     Post ID: ${like.postId}`);
            console.log(`     User ID: ${like.userId}`);
            console.log(`     Created: ${like.createdAt}`);
            console.log('');
          });
        }
      }
    });
    
    // Test 3: Check comments table
    console.log('💬 Test 3: Comments table');
    db.all(`
      SELECT c.*, p.title as postTitle, u.firstName, u.lastName, u.username 
      FROM comments c 
      LEFT JOIN posts p ON c.postId = p.id 
      LEFT JOIN users u ON c.authorId = u.id 
      ORDER BY c.createdAt DESC 
      LIMIT 5
    `, (err, rows) => {
      if (err) {
        console.error('❌ Error fetching comments:', err);
      } else {
        if (rows.length === 0) {
          console.log('📝 No comments found in database');
        } else {
          console.log('📝 Recent comments:');
          rows.forEach((comment, index) => {
            console.log(`  ${index + 1}. Comment ID: ${comment.id}`);
            console.log(`     Content: ${comment.content}`);
            console.log(`     Post: ${comment.postTitle || 'Unknown'}`);
            console.log(`     Author: ${comment.firstName} ${comment.lastName} (${comment.username})`);
            console.log(`     Created: ${comment.createdAt}`);
            console.log('');
          });
        }
      }
    });
    
    // Test 4: Check table structures
    console.log('🏗️ Test 4: Table structures');
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('posts', 'post_likes', 'comments')", (err, rows) => {
      if (err) {
        console.error('❌ Error checking tables:', err);
      } else {
        console.log('📝 Available tables:');
        rows.forEach((table) => {
          console.log(`  - ${table.name}`);
        });
        console.log('');
      }
      
      // Test 5: Check post_likes table structure
      db.all("PRAGMA table_info(post_likes)", (err, rows) => {
        if (err) {
          console.error('❌ Error checking post_likes structure:', err);
        } else {
          console.log('📝 post_likes table structure:');
          rows.forEach((column) => {
            console.log(`  - ${column.name}: ${column.type}`);
          });
          console.log('');
        }
        
        // Test 6: Check comments table structure
        db.all("PRAGMA table_info(comments)", (err, rows) => {
          if (err) {
            console.error('❌ Error checking comments structure:', err);
          } else {
            console.log('📝 comments table structure:');
            rows.forEach((column) => {
              console.log(`  - ${column.name}: ${column.type}`);
            });
            console.log('');
          }
          
          console.log('✅ Testing completed!');
          db.close();
        });
      });
    });
  });
}

testLikesAndComments();
