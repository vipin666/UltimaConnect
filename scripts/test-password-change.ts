import sqlite3 from 'sqlite3';
import path from 'path';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function testPasswordChange() {
  const dbPath = path.join(process.cwd(), 'tower-connect.db');
  const db = new sqlite3.Database(dbPath);

  console.log('Testing password change functionality...');

  try {
    // Get a sample user
    const user: any = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, username, password FROM users WHERE role = 'resident' LIMIT 1",
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!user) {
      console.log('No users found to test with');
      return;
    }

    console.log(`Testing with user: ${user.username} (${user.id})`);
    console.log(`Current password hash: ${user.password.substring(0, 20)}...`);

    // Hash a new password
    const newHashedPassword = await hashPassword('NewTestPassword123');
    console.log(`New password hash: ${newHashedPassword.substring(0, 20)}...`);

    // Update the password
    await new Promise<void>((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [newHashedPassword, user.id],
        function (this: sqlite3.RunResult, err: Error | null) {
          if (err) return reject(err);
          console.log(`Password updated. Rows affected: ${this.changes}`);
          resolve();
        }
      );
    });

    // Verify the password was updated
    const updatedUser: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, password FROM users WHERE id = ?',
        [user.id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    console.log(`Updated password hash: ${updatedUser.password.substring(0, 20)}...`);
    
    if (updatedUser.password === newHashedPassword) {
      console.log('✅ Password change test PASSED');
    } else {
      console.log('❌ Password change test FAILED');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    db.close();
  }
}

testPasswordChange().catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
