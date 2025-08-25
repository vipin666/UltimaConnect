# Overview

This is a mobile-first building management system for a 15-floor residential building called "Ultima Skymax Connect". The application serves multiple user roles (residents, admins, watchmen) and provides community features, amenity bookings, and building management capabilities. Built as a full-stack TypeScript application with React frontend and Express backend, it implements role-based access control and real-time interactions for residential building management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript in SPA (Single Page Application) mode
- **Routing**: Wouter for client-side routing with role-based route protection
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect (OIDC) integration
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API endpoints with role-based access control
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling with proper HTTP status codes

## Data Layer
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM with type-safe queries and migrations
- **Schema Design**: Normalized relational schema with proper foreign key relationships
- **Session Storage**: PostgreSQL-based session persistence

## Authentication & Authorization
- **Provider**: Replit Auth with OIDC flow
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Role-Based Access**: Four user roles (resident, admin, super_admin, watchman) with hierarchical permissions
- **Route Protection**: Frontend and backend route guards based on user roles

## Key Features Architecture
- **Community System**: Posts, comments, and social interactions with real-time updates
- **Booking System**: Time-slot based amenity reservations with conflict prevention
- **User Management**: Admin approval workflows for resident onboarding
- **Notification System**: Guest notifications and building alerts

## Mobile-Optimized Design
- **Bottom Navigation**: Tab-based navigation for easy thumb access
- **Responsive Components**: Mobile-first component design with touch-friendly interactions
- **PWA-Ready**: Configured for progressive web app capabilities

# External Dependencies

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Hosting**: Integrated development and deployment platform

## Authentication Services
- **Replit Auth**: OpenID Connect authentication provider with automatic user management

## UI & Styling
- **Shadcn/ui**: Pre-built React component library with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **TypeScript**: Static typing for enhanced development experience
- **Vite**: Fast build tool with HMR for development
- **Drizzle Kit**: Database migration and schema management tools

## Runtime Dependencies
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form handling with validation
- **Date-fns**: Date manipulation and formatting utilities
- **Wouter**: Lightweight client-side routing