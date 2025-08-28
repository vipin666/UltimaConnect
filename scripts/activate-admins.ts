import sqlite3 from 'sqlite3';

async function activateAdmins() {
  const dbPath = './tower-connect.db';
  const db = new sqlite3.Database(dbPath);

  console.log('Activating admin/super_admin users...');

  await new Promise<void>((resolve, reject) => {
    db.run(
      "UPDATE users SET status = 'active' WHERE role IN ('admin','super_admin')",
      function (err) {
        if (err) return reject(err);
        console.log(`Rows updated: ${this.changes}`);
        resolve();
      }
    );
  });

  // Show current admin users
  await new Promise<void>((resolve, reject) => {
    db.all(
      "SELECT id, username, role, status FROM users WHERE role IN ('admin','super_admin')",
      (err, rows) => {
        if (err) return reject(err);
        console.log('Admins now:');
        rows.forEach((r: any) =>
          console.log(`- ${r.username} (${r.role}) -> ${r.status}`)
        );
        resolve();
      }
    );
  });

  db.close();
}

activateAdmins().catch((e) => {
  console.error('Failed to activate admins:', e);
  process.exit(1);
});
