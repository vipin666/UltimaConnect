import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { hashPassword } from '../server/auth.js';

async function setupLocalDatabase() {
  try {
    console.log('Setting up local database...');
    
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    
    const adminUser = {
      id: 'admin-001',
      username: 'admin',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@towerconnect.local',
      unitNumber: 'Admin',
      role: 'super_admin' as const,
      status: 'active' as const,
      isOwner: true,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert admin user
    await db.insert(users).values(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: super_admin');
    console.log('');
    console.log('You can now log in to the application.');
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      console.log('✅ Admin user already exists.');
    } else {
      console.error('❌ Error setting up database:', error);
    }
  }
}

// Run setup
setupLocalDatabase().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
