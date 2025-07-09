# ShiftFlo - Multi-tenant Shift Management SaaS

## Overview

ShiftFlo is a comprehensive multi-tenant shift management SaaS application built with modern web technologies. The system enables businesses to manage staff scheduling, time tracking, holiday requests, and workforce analytics through a mobile-first interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state management
- **Routing**: React Router for client-side navigation
- **Build Tool**: Vite for development and production builds
- **Testing**: Vitest with React Testing Library

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with express-session
- **Validation**: Zod schemas shared between client and server
- **Email**: Nodemailer with Gmail SMTP for transactional emails
- **Payments**: Stripe integration for subscription management

### Database Design
- **Multi-tenancy**: Tenant isolation through `tenantId` field in all tables
- **Schema**: 23+ tables covering users, shifts, scheduling, analytics, and billing
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### User Management
- **Authentication**: Email/password login with account activation
- **Role System**: Owner and staff roles with different permissions
- **Profile Management**: Comprehensive user profiles with emergency contacts
- **Account Activation**: Token-based email verification system

### Shift Management
- **Scheduling**: Create, assign, and manage shifts with multiple assignment types
- **Opportunities**: Staff can claim available shifts through self-service
- **Templates**: Reusable shift patterns for recurring schedules
- **Swap Requests**: Staff-initiated shift exchanges with approval workflow

### Time Tracking
- **Clock In/Out**: Mobile-friendly time tracking with location awareness
- **Break Management**: Track break times and durations
- **Overtime**: Automatic overtime calculation based on policies
- **Manual Adjustments**: Owner override capabilities for time entries

### Holiday Management
- **Entitlements**: Annual leave allowances with carry-over support
- **Requests**: Staff holiday requests with approval workflow
- **Calendar**: Visual holiday calendar with conflict detection
- **Automatic Deductions**: Leave balances updated on approval

### Analytics & Reporting
- **Dashboard**: Real-time metrics for owners and staff
- **Performance**: Staff performance tracking and reports
- **Usage Analytics**: System usage and engagement metrics
- **Custom Reports**: Configurable reporting with data export

### Strike System
- **Automated Detection**: No-show and late cancellation detection
- **Point System**: Configurable strike points with expiration
- **Enforcement**: Automatic restrictions based on strike thresholds
- **Cron Jobs**: Background processing for strike management

## Data Flow

### Request Flow
1. **Client Request**: React components make API calls through React Query
2. **Route Handler**: Express routes validate and process requests
3. **Storage Layer**: Abstract storage interface for database operations
4. **Database**: PostgreSQL with Drizzle ORM for data persistence
5. **Response**: JSON responses with proper error handling

### Authentication Flow
1. **Login**: Email/password authentication with session creation
2. **Session Management**: Express session middleware with 24-hour expiry
3. **Authorization**: Role-based access control on all endpoints
4. **Token Verification**: Account activation and password reset tokens

### Real-time Updates
- **Polling**: React Query automatic background refetching
- **Optimistic Updates**: Client-side state updates for better UX
- **Error Handling**: Comprehensive error boundaries and toast notifications

## External Dependencies

### Core Dependencies
- **React**: UI framework with hooks and context
- **Express**: Web framework for REST API
- **Drizzle ORM**: Type-safe database operations
- **Tailwind CSS**: Utility-first CSS framework
- **Zod**: Schema validation library
- **React Query**: Server state management

### UI Components
- **shadcn/ui**: Modern React component library
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form handling with validation

### External Services
- **Stripe**: Payment processing for subscriptions
- **Nodemailer**: Email sending via Gmail SMTP
- **Neon**: Serverless PostgreSQL hosting

### Development Tools
- **TypeScript**: Static type checking
- **Vite**: Build tool and development server
- **ESLint**: Code linting and formatting
- **Vitest**: Unit and integration testing
- **Prettier**: Code formatting

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Local PostgreSQL or Neon development database
- **Environment Variables**: `.env` file for local configuration

### Production Deployment
- **Build Process**: Custom build pipeline with esbuild for server and Vite for client
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Static Assets**: Served directly from Express with proper caching headers
- **Environment**: Production environment variables for security

### CI/CD Pipeline
- **Linting**: ESLint and Prettier checks on commit
- **Testing**: Vitest test suite with coverage reporting
- **Type Checking**: TypeScript compilation verification
- **Build Verification**: Production build testing

### Security Considerations
- **Input Validation**: Zod schemas on all API endpoints
- **SQL Injection**: Parameterized queries through Drizzle ORM
- **Session Security**: Secure session configuration with httpOnly cookies
- **CORS**: Proper cross-origin resource sharing configuration
- **Environment Variables**: Sensitive data in environment variables only

The application follows a clean architecture pattern with clear separation of concerns, making it maintainable and scalable for multi-tenant SaaS operations.