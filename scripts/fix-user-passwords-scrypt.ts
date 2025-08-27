import sqlite3 from 'sqlite3';
import path from 'path';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const dbPath = path.join(process.cwd(), 'tower-connect.db');

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fixUserPasswords() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔧 Fixing user passwords with scrypt...\n');
  
  db.serialize(async () => {
    // Start transaction
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Fix admin user
      console.log('👨‍💼 Fixing admin user...');
      const adminPassword = await hashPassword('admin123');
      db.run(`
        UPDATE users SET password = ? WHERE username = ?
      `, [adminPassword, 'admin'], (err) => {
        if (err) {
          console.error('❌ Error fixing admin password:', err);
        } else {
          console.log('✅ Admin password fixed');
        }
      });
      
      // 2. Fix watchman user
      console.log('👮 Fixing watchman user...');
      const watchmanPassword = await hashPassword('watchman123');
      db.run(`
        UPDATE users SET password = ? WHERE username = ?
      `, [watchmanPassword, 'watchman'], (err) => {
        if (err) {
          console.error('❌ Error fixing watchman password:', err);
        } else {
          console.log('✅ Watchman password fixed');
        }
      });
      
      // 3. Fix committee members
      console.log('👨‍💼 Fixing committee members...');
      const committeeMembers = [
        { username: 'caretaker', password: 'caretaker123' },
        { username: 'secretary', password: 'secretary123' },
        { username: 'president', password: 'president123' },
        { username: 'treasurer', password: 'treasurer123' }
      ];
      
      for (const member of committeeMembers) {
        const hashedPassword = await hashPassword(member.password);
        db.run(`
          UPDATE users SET password = ? WHERE username = ?
        `, [hashedPassword, member.username], (err) => {
          if (err) {
            console.error(`❌ Error fixing ${member.username} password:`, err);
          } else {
            console.log(`✅ ${member.username} password fixed`);
          }
        });
      }
      
      // 4. Fix resident users (1-50)
      console.log('👥 Fixing resident users...');
      for (let i = 1; i <= 50; i++) {
        const residentPassword = await hashPassword(`resident${i}`);
        const username = `vipindasunknow${i}`;
        
        db.run(`
          UPDATE users SET password = ? WHERE username = ?
        `, [residentPassword, username], (err) => {
          if (err) {
            console.error(`❌ Error fixing resident ${i} password:`, err);
          }
        });
      }
      console.log('✅ All resident passwords fixed');
      
      // Commit transaction
      setTimeout(() => {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Error committing transaction:', err);
            db.run('ROLLBACK');
          } else {
            console.log('\n✅ All user passwords fixed successfully with scrypt!');
            console.log('\n🔑 Updated Login Credentials:');
            console.log('👨‍💼 Admin: admin / admin123');
            console.log('👮 Watchman: watchman / watchman123');
            console.log('👨‍💼 Caretaker: caretaker / caretaker123');
            console.log('👨‍💼 Secretary: secretary / secretary123');
            console.log('👨‍💼 President: president / president123');
            console.log('👨‍💼 Treasurer: treasurer / treasurer123');
            console.log('👥 Residents: vipindasunknow1 / resident1 (up to vipindasunknow50 / resident50)');
            
            console.log('\n🚀 You can now login with these credentials!');
          }
          db.close();
        });
      }, 3000); // Wait for all operations to complete
      
    } catch (error) {
      console.error('❌ Error during password fix:', error);
      db.run('ROLLBACK');
      db.close();
    }
  });
}

fixUserPasswords();
