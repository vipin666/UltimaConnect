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

async function setResidentPasswords() {
  const dbPath = path.join(process.cwd(), 'tower-connect.db');
  const db = new sqlite3.Database(dbPath);

  console.log('Setting all resident passwords to Skymax123 and activating residents...');

  const hashed = await hashPassword('Skymax123');

  await new Promise<void>((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => (err ? reject(err) : resolve()));
  });

  try {
    const rowsUpdated: number = await new Promise((resolve, reject) => {
      db.run(
        "UPDATE users SET password = ?, status = 'active' WHERE role = 'resident'",
        [hashed],
        function (this: sqlite3.RunResult, err: Error | null) {
          if (err) return reject(err);
          resolve(this.changes || 0);
        }
      );
    });

    console.log(`Residents updated: ${rowsUpdated}`);

    const sample: any[] = await new Promise((resolve, reject) => {
      db.all(
        "SELECT username, role, status FROM users WHERE role = 'resident' LIMIT 5",
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    console.log('Sample residents now:');
    sample.forEach((r) => console.log(`- ${r.username} (${r.role}) -> ${r.status}`));

    await new Promise<void>((resolve, reject) => {
      db.run('COMMIT', (err) => (err ? reject(err) : resolve()));
    });
  } catch (e) {
    console.error('Failed to update residents:', e);
    await new Promise<void>((resolve) => db.run('ROLLBACK', () => resolve()));
  } finally {
    db.close();
  }
}

setResidentPasswords().catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
