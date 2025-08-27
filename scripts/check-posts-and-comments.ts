import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

function checkPostsAndComments() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔍 Checking posts and comments...\n');
  
  db.serialize(() => {
    // Get all posts with their comment counts
    db.all(`
      SELECT p.id, p.title, p.content, p.type, p.status, p.createdAt, 
             COUNT(c.id) as commentCount,
             u.firstName, u.lastName, u.username
      FROM posts p 
      LEFT JOIN comments c ON p.id = c.postId 
      LEFT JOIN users u ON p.authorId = u.id
      GROUP BY p.id, p.title, p.content, p.type, p.status, p.createdAt, u.firstName, u.lastName, u.username
      ORDER BY p.createdAt DESC
    `, (err, rows) => {
      if (err) {
        console.error('❌ Error fetching posts:', err);
      } else {
        console.log('📝 All posts with comment counts:');
        rows.forEach((post, index) => {
          console.log(`  ${index + 1}. Post ID: ${post.id}`);
          console.log(`     Title: ${post.title}`);
          console.log(`     Type: ${post.type}`);
          console.log(`     Status: ${post.status}`);
          console.log(`     Author: ${post.firstName} ${post.lastName} (${post.username})`);
          console.log(`     Comments: ${post.commentCount}`);
          console.log(`     Created: ${post.createdAt}`);
          console.log('');
        });
      }
      
      // Get all comments with their post info
      db.all(`
        SELECT c.id, c.content, c.postId, c.authorId, c.createdAt,
               p.title as postTitle, p.id as postId,
               u.firstName, u.lastName, u.username
        FROM comments c 
        LEFT JOIN posts p ON c.postId = p.id 
        LEFT JOIN users u ON c.authorId = u.id 
        ORDER BY c.createdAt DESC
      `, (err, rows) => {
        if (err) {
          console.error('❌ Error fetching comments:', err);
        } else {
          console.log('💬 All comments:');
          if (rows.length === 0) {
            console.log('  No comments found');
          } else {
            rows.forEach((comment, index) => {
              console.log(`  ${index + 1}. Comment ID: ${comment.id}`);
              console.log(`     Content: ${comment.content}`);
              console.log(`     Post ID: ${comment.postId}`);
              console.log(`     Post Title: ${comment.postTitle || 'Unknown'}`);
              console.log(`     Author: ${comment.firstName} ${comment.lastName} (${comment.username})`);
              console.log(`     Created: ${comment.createdAt}`);
              console.log('');
            });
          }
        }
        
        db.close();
      });
    });
  });
}

checkPostsAndComments();
