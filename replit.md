# ShiftFlo - Multi-tenant Shift Management SaaS

## Overview

ShiftFlo is a comprehensive multi-tenant shift management SaaS application built with modern web technologies. The system enables businesses to manage staff scheduling, time tracking, holiday requests, and workforce analytics through a mobile-first interface.

**Recent Update (July 2025)**: Completed Phase 1 operational email notifications system with comprehensive shift-related email workflows including assignment notifications, reminders, swap requests, holiday requests, and emergency alerts.

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

### Operational Email Notifications (Phase 1 - July 2025)
- **Shift Assignment Emails**: Automated notifications when shifts are assigned to staff
- **Shift Reminders**: 24-hour advance reminders for upcoming confirmed shifts
- **Swap Request Notifications**: Email alerts for shift swap requests between staff
- **Holiday Request Workflow**: Owner notifications for new requests, staff notifications for status updates
- **Emergency Shift Alerts**: Urgent notifications for last-minute coverage needs (within 4 hours)
- **Template System**: Professional HTML email templates with responsive design
- **Smart Scheduling**: Automated reminder and alert scheduling with node-cron

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
- **Nodemailer**: Email sending via Gmail SMTP with operational notifications
- **Neon**: Serverless PostgreSQL hosting
- **Gmail SMTP**: Transactional and operational email delivery

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

## Recent Changes (July 2025)

### Phase 1 Operational Email Notifications Implementation
- **Email Templates**: Created professional HTML email templates for all shift-related workflows
  - `shift-assigned.hbs` - New shift assignments with accept/decline links
  - `shift-reminder.hbs` - 24-hour advance shift reminders
  - `swap-request.hbs` - Shift swap requests between staff
  - `holiday-request.hbs` - Holiday request notifications to owners
  - `holiday-status.hbs` - Holiday request status updates to staff
  - `emergency-alert.hbs` - Urgent shift coverage alerts

- **Email Service Layer**: Built comprehensive email utility system
  - `server/utils/email.ts` - Core email sending functions with template compilation
  - Handlebars-like template engine for dynamic content
  - Smart link generation with domain detection
  - Error handling and fallback mechanisms

- **Automated Scheduling**: Implemented reminder and alert scheduling
  - `server/reminder-scheduler.ts` - Node-cron based job scheduling
  - Hourly shift reminder checks (24-hour advance)
  - 15-minute emergency shift alert monitoring
  - Manual trigger capabilities for testing

- **Integration Points**: Email triggers added to all relevant workflows
  - Shift creation/assignment routes
  - Swap request creation
  - Holiday request submission and approval
  - Emergency shift coverage scenarios

- **Testing Framework**: Created comprehensive email testing system
  - `scripts/test-email-basic.ts` - Basic email functionality verification
  - `scripts/test-email-notifications.ts` - Complete workflow testing
  - Configuration validation and error diagnostics

### Technical Implementation Details
- **Template Engine**: Custom Handlebars-like engine for email templates
- **SMTP Configuration**: Gmail SMTP with app-specific passwords
- **Error Handling**: Graceful degradation when email fails
- **Activity Logging**: Optional activity log integration with foreign key safety
- **Domain Detection**: Automatic domain detection for email links
- **Security**: Secure template compilation and data sanitization