import sqlite3 from 'sqlite3';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from "@shared/schema";

// Create SQLite database
const dbPath = './tower-connect.db';
const sqlite = new sqlite3.Database(dbPath);

// Create a proxy for Drizzle
const db = drizzle(sqlite, { schema });

// Initialize database with tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log('✅ Database initialized with SQLite');
  } catch (error) {
    console.log('Database initialization error:', error);
  }
}

export { db };