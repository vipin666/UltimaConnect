import { connectDatabase } from './config/database';

// Initialize database with MongoDB
export async function initializeDatabase() {
  try {
    await connectDatabase();
    console.log('✅ Database initialized with MongoDB');
  } catch (error) {
    console.log('Database initialization error:', error);
    process.exit(1);
  }
}

// Export a placeholder for compatibility (will be removed later)
export const db = null;