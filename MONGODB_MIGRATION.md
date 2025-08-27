# MongoDB Migration Guide

This document outlines the migration from SQLite to MongoDB for the TowerConnect application.

## Overview

The application is being migrated from SQLite to MongoDB to provide:
- Better scalability
- More flexible schema
- Better performance for complex queries
- Native support for JSON data
- Better support for distributed systems

## Migration Status

- ✅ MongoDB models created
- ✅ MongoDB storage service implemented
- ✅ Database connection configuration updated
- ✅ Migration script created
- 🔄 Routes need to be updated to use MongoDB storage
- 🔄 Frontend may need minor adjustments

## Prerequisites

1. **MongoDB Installation**: Install MongoDB on your system
   - [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud service)

2. **Environment Variables**: Set up MongoDB connection
   ```bash
   # Add to your .env file
   MONGODB_URI=mongodb://localhost:27017/tower-connect
   ```

## Migration Steps

### 1. Install Dependencies
```bash
npm install mongodb mongoose
npm install --save-dev @types/mongodb
```

### 2. Start MongoDB
```bash
# Start MongoDB service
mongod

# Or if using MongoDB Atlas, no local setup needed
```

### 3. Run Migration
```bash
npm run migrate-to-mongodb
```

This script will:
- Connect to both SQLite and MongoDB
- Migrate all data from SQLite to MongoDB
- Preserve all relationships and data integrity
- Handle duplicate entries gracefully

### 4. Update Application to Use MongoDB

The following files need to be updated to use the new MongoDB storage:

#### Server Routes (`server/routes.ts`)
- Replace `storage` imports with `mongoStorage`
- Update all database operations to use MongoDB methods

#### Authentication (`server/auth.ts`)
- Update to use MongoDB user validation

#### Any other files using the old storage

### 5. Test the Migration

1. Start the application with MongoDB:
   ```bash
   npm run dev
   ```

2. Verify all functionality works:
   - User authentication
   - Posts and comments
   - Bookings
   - Visitor management
   - Admin functions

## MongoDB Models

The following models have been created:

### Core Models
- **User**: Users with roles and authentication
- **Flat**: Apartment units with assignments
- **Post**: Community posts and announcements
- **Comment**: Comments on posts
- **PostLike**: Post likes and reactions

### Feature Models
- **Amenity**: Available amenities for booking
- **Booking**: Amenity bookings and reservations
- **Visitor**: Visitor registrations
- **BiometricRequest**: Biometric access requests

## Database Schema

### User Schema
```typescript
{
  username: string (unique),
  password: string (hashed),
  firstName: string,
  lastName: string,
  email: string (unique),
  role: enum,
  unitNumber?: string,
  phone?: string,
  timestamps
}
```

### Post Schema
```typescript
{
  title: string,
  content: string,
  type: enum,
  status: enum,
  authorId: ObjectId (ref: User),
  adminComment?: string,
  timestamps
}
```

### Booking Schema
```typescript
{
  userId: ObjectId (ref: User),
  amenityId: ObjectId (ref: Amenity),
  bookingDate: Date,
  startTime: string,
  endTime: string,
  status: enum,
  guestParkingSlot?: string,
  adminComment?: string,
  timestamps
}
```

## Indexes

Performance indexes have been created for:
- User lookups (username, email, role)
- Post queries (author, type, status)
- Booking queries (user, amenity, date)
- Comment queries (post, author)
- Like queries (post, user)

## Rollback Plan

If issues arise during migration:

1. **Keep SQLite backup**: The original SQLite database remains untouched
2. **Revert code changes**: Switch back to SQLite storage
3. **Restart application**: Use the original database

## Benefits of MongoDB

1. **Scalability**: Better horizontal scaling
2. **Flexibility**: Schema can evolve without migrations
3. **Performance**: Better for read-heavy workloads
4. **JSON Native**: Natural fit for JavaScript/TypeScript
5. **Aggregation**: Powerful query capabilities
6. **Indexing**: Flexible indexing strategies

## Next Steps

1. Update all routes to use MongoDB storage
2. Test all functionality thoroughly
3. Update deployment configuration
4. Monitor performance and optimize queries
5. Consider adding MongoDB-specific features

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MongoDB is running
   - Verify connection string
   - Check firewall settings

2. **Migration Errors**
   - Check data integrity in SQLite
   - Verify MongoDB permissions
   - Check for duplicate unique fields

3. **Performance Issues**
   - Review and optimize indexes
   - Check query patterns
   - Monitor MongoDB performance

### Support

For issues during migration:
1. Check MongoDB logs
2. Review application logs
3. Verify data integrity
4. Test with smaller datasets first
