import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

function checkComments() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔍 Checking comments in database...\n');
  
  db.serialize(() => {
    // Check comments table structure
    db.all("PRAGMA table_info(comments)", (err, rows) => {
      if (err) {
        console.error('❌ Error checking comments table structure:', err);
      } else {
        console.log('📋 Comments table structure:');
        rows.forEach((row) => {
          console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });
        console.log('');
      }
    });

    // Check total number of comments
    db.get("SELECT COUNT(*) as count FROM comments", (err, row) => {
      if (err) {
        console.error('❌ Error counting comments:', err);
      } else {
        console.log(`📊 Total comments in database: ${row.count}`);
        console.log('');
      }
    });

    // Check comments with post and author info
    db.all(`
      SELECT c.*, p.title as postTitle, u.firstName, u.lastName, u.username 
      FROM comments c 
      LEFT JOIN posts p ON c.postId = p.id 
      LEFT JOIN users u ON c.authorId = u.id 
      ORDER BY c.createdAt DESC 
      LIMIT 10
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
      
      // Check posts with comments
      db.all(`
        SELECT p.id, p.title, COUNT(c.id) as commentCount 
        FROM posts p 
        LEFT JOIN comments c ON p.id = c.postId 
        GROUP BY p.id, p.title 
        HAVING commentCount > 0 
        ORDER BY commentCount DESC
      `, (err, rows) => {
        if (err) {
          console.error('❌ Error fetching posts with comments:', err);
        } else {
          if (rows.length === 0) {
            console.log('📝 No posts have comments');
          } else {
            console.log('📝 Posts with comments:');
            rows.forEach((post) => {
              console.log(`  - ${post.title}: ${post.commentCount} comments`);
            });
          }
        }
        
        db.close();
      });
    });
  });
}

checkComments();
