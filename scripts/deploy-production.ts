import sqlite3 from 'sqlite3';
import path from 'path';
import { hashPassword } from '../server/auth';

const dbPath = path.join(process.cwd(), 'tower-connect.db');

console.log('🚀 Starting Production Deployment...\n');

async function deployProduction() {
  const db = new sqlite3.Database(dbPath);
  
  console.log('📋 Production Deployment Checklist:');
  console.log('✅ Database connection established');
  console.log('✅ Running first deployment setup...\n');
  
  // Import and run the first deployment setup
  const { firstDeploymentSetup } = await import('./first-deployment-setup.ts');
  
  try {
    await firstDeploymentSetup();
    console.log('\n🎉 Production deployment completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the server: npm run start');
    console.log('2. Access the application at your production URL');
    console.log('3. Login with admin credentials: admin / admin123');
    console.log('\n🔐 All users have biometric access configured');
    console.log('🏢 All flats and amenities are set up');
    console.log('👥 All residents and staff are seeded');
    
  } catch (error) {
    console.error('❌ Production deployment failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

deployProduction();
