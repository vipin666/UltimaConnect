# TowerConnect - Development Guide

## 🏗️ Project Overview

TowerConnect is a comprehensive residential building management system designed for 15-floor residential buildings. It provides a complete solution for managing residents, amenities, bookings, maintenance, visitors, and administrative tasks.

## 📁 Project Structure

```
TowerConnect/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── main.tsx       # Application entry point
├── server/                # Express.js backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── auth.ts            # Authentication utilities
│   └── index.ts           # Server entry point
├── scripts/               # Database and seeding scripts
├── shared/                # Shared schemas and types
└── package.json           # Project dependencies
```

## 🗄️ Database Schema

### Core Tables

#### Users
- **Purpose**: Store resident, admin, and watchman information
- **Key Fields**: `id`, `username`, `password`, `firstName`, `lastName`, `email`, `unitNumber`, `role`, `status`, `isOwner`
- **Roles**: `resident`, `admin`, `super_admin`, `watchman`
- **Status**: `active`, `pending`, `suspended`

#### Amenities
- **Purpose**: Manage building amenities for booking
- **Key Fields**: `id`, `name`, `description`, `type`, `capacity`, `isActive`
- **Types**: `swimming_pool`, `gym`, `community_hall`, `garden`, `pool_table`

#### Bookings
- **Purpose**: Track amenity reservations with time slots
- **Key Fields**: `id`, `userId`, `amenityId`, `bookingDate`, `startTime`, `endTime`, `status`
- **Features**: Time slot conflict detection, dynamic availability

#### Posts
- **Purpose**: Community announcements and complaints
- **Key Fields**: `id`, `title`, `content`, `type`, `authorId`, `status`, `likes`
- **Types**: `general`, `announcement`, `complaint`

#### Maintenance Requests
- **Purpose**: Track building maintenance issues
- **Key Fields**: `id`, `title`, `description`, `category`, `priority`, `status`, `unitNumber`, `userId`
- **Status**: `pending`, `in_progress`, `completed`, `cancelled`

#### Visitors
- **Purpose**: Manage visitor entry and tracking
- **Key Fields**: `id`, `name`, `phone`, `purpose`, `unitToVisit`, `status`, `vehicleNumber`, `guestParkingSlot`
- **Status**: `pending`, `approved`, `rejected`, `checked_in`, `checked_out`

#### Biometric Requests
- **Purpose**: Manage biometric access permissions
- **Key Fields**: `id`, `userId`, `requestType`, `accessLevel`, `status`
- **Types**: `fingerprint`, `facial`, `card`
- **Levels**: `basic`, `full`, `maintenance`

#### Flats
- **Purpose**: Manage flat information and assignments
- **Key Fields**: `id`, `flatNumber`, `floor`, `type`, `status`, `ownerId`, `tenantId`
- **Status**: `available`, `occupied`, `maintenance`

## 🔐 Authentication System

### Local Authentication
- **Strategy**: Passport.js with Local Strategy
- **Session Management**: MemoryStore for development
- **Password Hashing**: bcrypt with salt rounds
- **Session Persistence**: Cookie-based sessions

### User Roles & Permissions

#### Resident
- View and create posts
- Book amenities
- Submit maintenance requests
- Verify visitors for their unit
- View personal fees and payments

#### Admin/Super Admin
- All resident permissions
- Manage users (enable/disable, edit roles)
- View all bookings, posts, maintenance requests
- Manage amenities and time slots
- Access financial management
- Manage biometric access
- Register and manage visitors

#### Watchman
- Register visitors
- Check in/out visitors
- View vehicle and parking information
- Access visitor management

## 🎯 Core Features

### 1. User Management
- **User Registration**: Self-registration with admin approval
- **Role Management**: Assign roles and manage permissions
- **Status Control**: Enable/disable user accounts
- **Flat Assignment**: Link users to specific flats as owners/tenants

### 2. Amenity Booking System
- **Dynamic Time Slots**: Different slot configurations per amenity type
- **Real-time Availability**: Shows available vs booked slots
- **Conflict Detection**: Prevents double-booking
- **Booking Management**: View, cancel, and track bookings

#### Time Slot Configurations
- **Swimming Pool**: Morning (6-10 AM) and Evening (6-10 PM) slots
- **Gym**: 2-hour slots from 5 AM to 11 PM
- **Community Hall**: Full day booking
- **Garden**: 1-hour slots from 6 AM to 6 PM
- **Pool Table**: 1-hour slots from 9 AM to 9 PM

### 3. Community Features
- **Posts**: Create and view community posts
- **Comments**: Engage with posts
- **Likes**: React to posts
- **Types**: General, announcements, complaints

### 4. Maintenance Management
- **Request Submission**: Residents can submit maintenance requests
- **Status Tracking**: Track request progress
- **Assignment**: Assign requests to maintenance staff
- **Categories**: Plumbing, electrical, HVAC, general
- **Priorities**: Low, medium, high, urgent

### 5. Visitor Management
- **Registration**: Watchmen/admins register visitors
- **Verification**: Residents approve visitor entry
- **Check-in/out**: Track visitor entry and exit
- **Vehicle Tracking**: Optional vehicle number and parking slot
- **Status Management**: Pending, approved, rejected, checked in/out

### 6. Biometric Access Control
- **Request Types**: Fingerprint, facial recognition, card access
- **Access Levels**: Basic, full, maintenance access
- **Admin Control**: Enable/disable biometric access per user
- **Status Tracking**: Pending, approved, rejected

### 7. Financial Management
- **Fee Types**: Define different fee categories
- **Fee Schedules**: Set up recurring fees
- **Payment Tracking**: Record and track payments
- **Transaction History**: View payment history
- **Financial Reports**: Generate financial summaries

### 8. Flat Management
- **Flat Information**: Store flat details and specifications
- **Owner/Tenant Assignment**: Link users to flats
- **Status Tracking**: Available, occupied, maintenance
- **Floor Management**: Organize by floor numbers

## 🎨 UI/UX Features

### Mobile-First Design
- **Responsive Layout**: Optimized for mobile devices
- **Bottom Navigation**: Easy tab switching
- **Touch-Friendly**: Large buttons and touch targets
- **Progressive Web App**: Works offline with service workers

### Admin Dashboard
- **Overview Tab**: Quick stats and recent activities
- **User Management**: Filter, search, and manage users
- **Maintenance Management**: Track and assign requests
- **Biometric Management**: Control access permissions
- **Flat Management**: Manage flat assignments

### Navigation System
- **Home Button**: Consistent navigation across pages
- **Role-Based Tabs**: Different tabs for different user roles
- **Breadcrumb Navigation**: Clear page hierarchy
- **Quick Actions**: Fast access to common tasks

## 🔧 Technical Implementation

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **State Management**: React Query for server state
- **Routing**: Wouter for client-side routing
- **UI Components**: Custom component library with shadcn/ui
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Lucide React for consistent iconography

### Backend (Node.js + Express)
- **Framework**: Express.js with TypeScript
- **Database**: SQLite with direct queries (no ORM)
- **Authentication**: Passport.js with local strategy
- **Validation**: Zod for request/response validation
- **File Storage**: Local file system for uploads

### Database Operations
- **Direct SQL**: Raw SQL queries for performance
- **Connection Pooling**: Efficient database connections
- **Transaction Support**: ACID compliance for critical operations
- **Migration System**: Version-controlled schema changes

## 🚀 Development Workflow

### Setup Commands
```bash
# Install dependencies
npm install

# Create database and seed data
npm run create-db
npm run seed-residents
npm run seed-amenities
npm run seed-biometric

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run create-db`: Initialize database schema
- `npm run seed-residents`: Seed resident data
- `npm run seed-amenities`: Seed amenity data
- `npm run seed-biometric`: Seed biometric data

### Environment Configuration
- **Database**: SQLite file (`tower-connect.db`)
- **Port**: 3000 (configurable)
- **Session Secret**: Configured in `server/localAuth.ts`
- **File Uploads**: `./uploads` directory

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/register`: User registration
- `POST /api/auth/logout`: User logout
- `GET /api/auth/user`: Get current user

### Users
- `GET /api/users`: Get all users (admin only)
- `POST /api/users`: Create user (admin only)
- `PATCH /api/users/:id`: Update user (admin only)
- `DELETE /api/users/:id`: Delete user (admin only)

### Amenities & Bookings
- `GET /api/amenities`: Get all amenities
- `GET /api/bookings`: Get bookings (user-specific or all for admin)
- `POST /api/bookings`: Create booking
- `GET /api/bookings/available-slots`: Get available time slots
- `PATCH /api/bookings/:id/cancel`: Cancel booking

### Community
- `GET /api/posts`: Get posts
- `POST /api/posts`: Create post
- `PATCH /api/posts/:id`: Update post
- `DELETE /api/posts/:id`: Delete post

### Maintenance
- `GET /api/maintenance-requests`: Get maintenance requests
- `POST /api/maintenance-requests`: Create request
- `PATCH /api/maintenance-requests/:id`: Update request

### Visitors
- `GET /api/visitors`: Get visitors
- `POST /api/visitors`: Register visitor
- `PATCH /api/visitors/:id/verify`: Verify visitor
- `PATCH /api/visitors/:id/checkin`: Check in visitor
- `PATCH /api/visitors/:id/checkout`: Check out visitor

### Biometric
- `GET /api/biometric-requests`: Get biometric requests
- `POST /api/biometric-requests`: Create request
- `POST /api/biometric-access/enable`: Enable access
- `POST /api/biometric-access/disable`: Disable access

### Financial
- `GET /api/fee-types`: Get fee types
- `GET /api/fee-schedules`: Get fee schedules
- `GET /api/payments`: Get payments
- `GET /api/fee-transactions`: Get transactions

## 🧪 Testing Strategy

### Manual Testing Areas
- **Authentication Flow**: Login, logout, session management
- **Booking System**: Time slot selection, conflict detection
- **Admin Features**: User management, maintenance tracking
- **Visitor Management**: Registration, verification, check-in/out
- **Mobile Responsiveness**: Touch interactions, screen sizes

### Key Test Scenarios
1. **User Registration**: New user signup and admin approval
2. **Amenity Booking**: Select date, view available slots, book
3. **Visitor Registration**: Watchman registers, resident verifies
4. **Maintenance Request**: Submit request, track progress
5. **Admin Dashboard**: Manage users, view reports, control access

## 🔮 Future Enhancements

### Planned Features
- **Push Notifications**: Real-time alerts for bookings, visitors
- **Payment Integration**: Online payment processing
- **Advanced Reporting**: Analytics and insights
- **Mobile App**: Native iOS/Android applications
- **IoT Integration**: Smart lock integration for biometric access

### Technical Improvements
- **Database Migration**: PostgreSQL for production
- **Caching Layer**: Redis for performance optimization
- **API Documentation**: OpenAPI/Swagger documentation
- **Unit Testing**: Jest and React Testing Library
- **CI/CD Pipeline**: Automated testing and deployment

## 🐛 Common Issues & Solutions

### Development Issues
1. **Database Lock**: Restart server if SQLite is locked
2. **Session Issues**: Clear browser cookies or restart server
3. **Port Conflicts**: Change port in `server/index.ts`
4. **Build Errors**: Clear node_modules and reinstall

### Production Considerations
1. **Database**: Use PostgreSQL for concurrent access
2. **Sessions**: Use Redis or database for session storage
3. **File Storage**: Use cloud storage (AWS S3, etc.)
4. **Security**: Implement rate limiting and CORS
5. **Monitoring**: Add logging and error tracking

## 📞 Support & Maintenance

### Code Organization
- **Components**: Reusable UI components in `client/src/components/`
- **Pages**: Route-specific components in `client/src/pages/`
- **Hooks**: Custom React hooks in `client/src/hooks/`
- **API Routes**: Backend endpoints in `server/routes.ts`
- **Database**: Storage operations in `server/storage.ts`

### Development Guidelines
- **TypeScript**: Use strict typing throughout
- **Error Handling**: Implement proper error boundaries
- **Loading States**: Show loading indicators for async operations
- **Validation**: Client and server-side validation
- **Accessibility**: Follow WCAG guidelines

This documentation provides complete context for any AI tool to understand the TowerConnect application architecture, features, and development patterns. The system is designed to be modular, scalable, and maintainable for future enhancements.
