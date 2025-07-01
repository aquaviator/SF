# Agent Shifts - Shift Rostering SaaS

## Overview

Agent Shifts is a mobile-first, multi-tenant shift-rostering SaaS application built with React, TypeScript, and Tailwind CSS. The application provides comprehensive shift management functionality for businesses with two primary user roles: owners (managers) and staff members. The system uses a modern full-stack architecture with Express.js backend and React frontend, featuring modal-driven CRUD operations and role-based access control.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives via shadcn/ui
- **Build Tool**: Vite for development and build processes

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful endpoints with JSON responses
- **Validation**: Zod schemas shared between client and server
- **Development**: Hot reload with Vite middleware integration

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle with type-safe queries
- **Schema Management**: Drizzle migrations
- **Development Storage**: In-memory storage class for development/testing

## Key Components

### Authentication & Authorization
- **Stub Authentication**: AuthContext provides role-based access without real authentication
- **User Roles**: Owner (manager) and Staff with different UI and functionality
- **Multi-tenancy**: Tenant-scoped data access with tenantId filtering
- **Development Tools**: Role switching for testing different user experiences

### Data Models
- **Users**: Authentication, roles, and profile information
- **Shifts**: Schedule management with dates, times, assignments, and status
- **Opportunities**: Available shifts that staff can claim
- **Swap Requests**: Staff-initiated shift exchange requests

### UI Components
- **DataTable**: Reusable table component with sorting, filtering, and actions
- **ModalForm**: Standardized modal-driven CRUD forms
- **Menu**: Role-aware navigation with mobile-first responsive design
- **useCrud Hook**: Generic CRUD operations with React Query integration

### Configuration Management
- **Environment-based Config**: Separate configurations for development, production, and test
- **Zod Validation**: Type-safe configuration with schema validation
- **Firebase Integration**: Prepared for Firebase services with emulator support

## Data Flow

### Client-Server Communication
1. **API Requests**: Centralized API client with error handling and authentication
2. **Query Management**: React Query handles caching, refetching, and optimistic updates
3. **Form Submission**: React Hook Form with Zod validation before API calls
4. **Error Handling**: Consistent error boundaries and toast notifications

### State Management
1. **Server State**: React Query manages all server data with caching
2. **Client State**: React Context for authentication and global UI state
3. **Form State**: React Hook Form for complex form interactions
4. **URL State**: Wouter for navigation and route-based state

### Role-Based Access
1. **Route Protection**: Menu component filters navigation based on user role
2. **Data Filtering**: API endpoints filter data by tenant and user permissions
3. **UI Adaptation**: Components render different features based on user role

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Query for state management
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Build tool and development server

### UI and Form Libraries
- **Radix UI**: Accessible component primitives
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation and type generation
- **Lucide React**: Icon library

### Backend Dependencies
- **Express.js**: Web server framework
- **Drizzle ORM**: Type-safe database toolkit
- **Neon**: Serverless PostgreSQL database

### Development and Testing
- **Jest**: Testing framework with React Testing Library
- **ESLint & Prettier**: Code quality and formatting
- **Husky & lint-staged**: Git hooks for code quality enforcement
- **TypeScript**: Static type checking

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express API
- **Database**: Neon serverless PostgreSQL
- **Hot Reload**: Full-stack hot reload with Vite middleware
- **Environment Variables**: Development-specific configuration

### Production Build
- **Frontend**: Vite builds optimized React bundle
- **Backend**: esbuild bundles Express server for production
- **Static Assets**: Served from dist/public directory
- **Database**: Production Neon PostgreSQL instance

### CI/CD Pipeline
- **Testing**: Automated test suite runs on every commit
- **Linting**: Code quality checks prevent broken deployments
- **Build Verification**: Ensures all components build successfully
- **Git Hooks**: Pre-commit hooks run tests and linting

### Quality Assurance
- **Test Coverage**: Jest and React Testing Library for component testing
- **Type Safety**: TypeScript ensures compile-time error detection
- **Code Standards**: ESLint and Prettier enforce consistent code style
- **Commit Gating**: Husky prevents commits that break tests or linting

## Changelog
- July 01, 2025. Initial setup
- July 01, 2025. Fixed Select form validation issues and added comprehensive tests:
  - Fixed empty value SelectItems in Shifts and Swap Requests forms
  - Added SelectForms.test.tsx to validate all Select components have non-empty values
  - Added SmokeTests.test.tsx for all page components with console error detection
  - Added FormValidation.test.tsx with comprehensive form behavior testing
  - Updated form default values to prevent controlled/uncontrolled component warnings
  - Fixed form submission logic to handle new placeholder values properly
- July 01, 2025. Completed all 4 remaining Owner modules (7/7) with comprehensive functionality:
  - Business Settings (/owner/settings) - Business profile, job roles, operating hours with full CRUD
  - Policies (/owner/policies) - Shift policies and notification settings with modal forms
  - Analytics (/owner/analytics) - Charts (Recharts), reports table, activity log with filters
  - Subscription (/owner/subscription) - Plan management, billing forms, usage metrics, invoices
  - Added Recharts dependency for chart visualization
  - Created comprehensive test suites for all 4 new modules
  - Updated App routing with all Owner module paths
- July 01, 2025. Fixed "Profile Data not loaded" bug and implemented commit gating:
  - Replaced useQuery with manual state management using useState and useEffect
  - Added proper loading states with Loader2 spinner component
  - Fixed API data fetching to properly handle response.json() parsing
  - Enhanced ProfilePage with comprehensive error handling and loading UX
  - Updated profile form to merge existing user data with form updates for API validation
  - Created comprehensive ProfilePage.test.tsx with loading state and error state tests
  - Set up basic commit gating with Husky pre-commit hooks for TypeScript and ESLint checks
  - Profile functionality verified working through server logs and manual testing

## User Preferences
Preferred communication style: Simple, everyday language.