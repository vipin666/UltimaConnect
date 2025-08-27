# TowerConnect - Local Development Setup

This is a local development version of TowerConnect with all external dependencies removed.

## Changes Made

### Removed External Dependencies:
- **Neon Database** → **PostgreSQL** (local database)
- **Replit Authentication** → **Local Authentication** (username/password)
- **Google Cloud Storage** → **Local File Storage** (uploads directory)
- **SendGrid Email** → **Console logging** (for development)
- **Stripe Payments** → **Mock payment system** (for development)
- **Replit-specific plugins** → **Standard Vite configuration**

### Added Local Alternatives:
- PostgreSQL database with Drizzle ORM
- Local file upload system with Multer
- Session-based authentication with Passport.js
- Local file serving for uploads

## Prerequisites

- Node.js 18+ 
- npm or yarn
- **PostgreSQL** (local installation or Docker)

## PostgreSQL Setup

### Option 1: Local PostgreSQL Installation
1. Install PostgreSQL on your system
2. Create a database named `tower_connect`
3. Create a user with access to the database

### Option 2: Docker (Recommended)
```bash
# Run PostgreSQL in Docker
docker run --name tower-connect-db \
  -e POSTGRES_DB=tower_connect \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TowerConnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and set your database credentials:
   ```env
   SESSION_SECRET=your-secret-key-change-in-production
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=tower_connect
   ```

4. **Generate database schema**
   ```bash
   npm run db:generate
   ```

5. **Push schema to database**
   ```bash
   npm run db:push
   ```

6. **Set up initial data**
   ```bash
   npm run setup
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build
```bash
npm run build
npm start
```

## Database Management

- **View database**: `npm run db:studio`
- **Generate migrations**: `npm run db:generate`
- **Apply migrations**: `npm run db:migrate`
- **Push schema changes**: `npm run db:push`

## File Storage

- Uploaded files are stored in the `./uploads` directory
- Files are served at `/uploads/` URL path
- Maximum file size: 10MB
- Supported formats: jpeg, jpg, png, gif, pdf, doc, docx

## Authentication

The application now uses local authentication:

- **Registration**: POST `/api/auth/register`
- **Login**: POST `/api/auth/login`
- **Logout**: GET `/api/auth/logout`
- **User info**: GET `/api/auth/user`

### Creating Admin Users

You can create admin users through the API or directly in the database. The first user created will need to be manually updated to have admin privileges.

## Features Available

✅ **User Management** - Registration, login, role-based access
✅ **Community Posts** - Create, read, update posts and comments
✅ **Amenity Bookings** - Book and manage facility reservations
✅ **Maintenance Requests** - Submit and track maintenance issues
✅ **Guest Notifications** - Manage visitor access
✅ **Messaging** - Internal messaging system
✅ **Announcements** - Admin announcements
✅ **Financial Management** - Fee tracking and payments
✅ **Visitor Management** - Register and track visitors
✅ **Document Management** - Upload and manage tenant documents
✅ **Biometric Requests** - Manage biometric access requests

## Limitations (Local Development)

- **Email notifications** are logged to console instead of being sent
- **Payment processing** is simulated (no real payments)
- **File storage** is local (not cloud-based)
- **Sessions** are stored in PostgreSQL (not Redis)

## Troubleshooting

### Database Issues
- Make sure PostgreSQL is running and accessible
- Check your database credentials in `.env`
- If using Docker, ensure the container is running: `docker ps`
- Try connecting to the database manually to verify credentials

### Port Issues
- If port 5000 is in use, change the PORT in your `.env` file
- If port 5432 is in use, change the DB_PORT in your `.env` file

### File Upload Issues
- Ensure the `uploads` directory has write permissions
- Check file size limits (10MB max)

## Production Deployment

For production deployment, you should:

1. Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
2. Set up email service (SendGrid, AWS SES)
3. Use cloud storage (AWS S3, Google Cloud Storage)
4. Set up payment processing (Stripe, PayPal)
5. Use Redis for sessions
6. Set proper environment variables
7. Use HTTPS
8. Set up proper logging and monitoring

## Support

For issues or questions, please check the original project documentation or create an issue in the repository.
