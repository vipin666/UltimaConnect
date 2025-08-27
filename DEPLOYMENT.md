# TowerConnect Production Deployment Guide

## 🚀 Quick Start

For first-time production deployment, run:

```bash
npm run deploy-production
```

This will automatically:
- ✅ Create admin user
- ✅ Set up all amenities
- ✅ Create all flats from CSV data
- ✅ Seed all residents and staff
- ✅ Configure biometric access for all users
- ✅ Set up all necessary database tables and constraints

## 📋 Manual Deployment Steps

If you prefer to run steps manually:

### 1. Database Setup
```bash
# Create database and tables
npm run create-db

# Push schema changes
npm run db:push
```

### 2. First Deployment Setup
```bash
# Run comprehensive first deployment setup (includes biometric data)
npm run first-deployment
```

### 3. Start Production Server
```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🔑 Default Login Credentials

After deployment, you can login with:

### Admin Access
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Super Admin

### Resident Access
- **Username:** `name_flatno` (e.g., `annjoseph_101b`)
- **Password:** `password123`
- **Role:** Resident

### Staff Access
- **Username:** `name` (e.g., `sujith`)
- **Password:** `password123`
- **Role:** Staff/Caretaker/Watchman

## 🔐 Biometric Access

All users have biometric IDs configured:
- **Residents:** Original biometric IDs from CSV (e.g., 121, 122, etc.)
- **Staff:** Generated biometric IDs (STAFF001, STAFF002, etc.)
- **Status:** All biometric requests are pre-approved

## 📊 Seeded Data

The deployment includes:

### Flats (52 total)
- All flats from 101 A to 106 G
- Properly categorized as apartments and penthouses
- Floor numbers assigned based on flat numbers

### Residents (127 total)
- All residents from the provided CSV data
- Usernames: `name_flatno` format
- Passwords: `password123`
- Emails: `username@towerconnect.com`

### Staff (6 total)
- SUJITH (Caretaker/Manager)
- KHIMANADA (Housekeeping)
- VARGHESE (Watchman2)
- RAVINDRA (Watchman1)
- AMMINI (Cleaning staff)
- REMANI (Cleaning staff)

### Amenities (8 total)
- Swimming Pool
- Gym
- Garden
- Guest Parking Slots (3)
- Community Hall
- Children Play Area

## 🛠️ Additional Scripts

### Individual Seeding Scripts
```bash
# Seed only biometric data
npm run seed-biometric-data

# Seed only residents
npm run seed-residents

# Seed only amenities
npm run seed-amenities

# Seed only bookings
npm run seed-bookings
```

### Database Management
```bash
# Clear residents and flats (preserves admin/staff)
npm run delete-residents-and-flats

# Fix missing database columns
npm run fix-missing-columns

# Add booking constraints
npm run add-booking-constraints
```

## 🔧 Troubleshooting

### If deployment fails:
1. Check if database file exists: `tower-connect.db`
2. Ensure all dependencies are installed: `npm install`
3. Check database permissions
4. Review console output for specific error messages

### If users can't login:
1. Verify password hashing is consistent
2. Check if users exist in database
3. Ensure biometric data is properly seeded

### If biometric access doesn't work:
1. Verify biometric_requests table has data
2. Check if biometric IDs match expected values
3. Ensure biometric requests are approved

## 📝 Environment Variables

For production, consider setting:
- `NODE_ENV=production`
- `PORT=3000` (or your preferred port)
- `SESSION_SECRET=your-secure-session-secret`

## 🚀 Production Considerations

1. **Security:** Change default passwords after first login
2. **Backup:** Regularly backup the `tower-connect.db` file
3. **Monitoring:** Set up application monitoring
4. **SSL:** Use HTTPS in production
5. **Updates:** Keep dependencies updated

## 📞 Support

For deployment issues:
1. Check the console output for error messages
2. Verify all prerequisites are met
3. Review the database schema and constraints
4. Ensure all required tables exist

---

**Note:** This deployment script is designed for first-time setup. For subsequent deployments, use individual scripts as needed.
