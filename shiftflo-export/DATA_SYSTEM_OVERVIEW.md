# Agent Shifts - Data System Overview

## Executive Summary

Agent Shifts is a multi-tenant shift-rostering SaaS application currently using **in-memory storage** for development. The system implements comprehensive CRUD operations across 12+ data models with role-based access control. **Critical Issue**: Data does not persist across server restarts, which occurs during page navigation in the current Replit environment.

## Current Data Architecture

### Storage Implementation
- **Primary**: `MemStorage` class in `server/storage.ts`
- **Interface**: `IStorage` defining all CRUD operations
- **Database Ready**: PostgreSQL schema defined, migration ready
- **Development State**: All data resets to sample data on server restart

### Data Models (12 Core Entities)

#### User Management
- **Users**: Authentication, roles (owner/staff), profile data
- **Business Profiles**: Company information, settings per tenant
- **Job Roles**: Position definitions with rates and responsibilities
- **Departments**: Organizational units within businesses
- **Locations**: Physical work locations for shift assignments

#### Scheduling Core
- **Shifts**: Individual work assignments with dates/times/staff
- **Schedule Templates**: Reusable shift patterns and rotations
- **Operating Hours**: Business hours defining when shifts can occur
- **Opportunities**: Available shifts staff can claim
- **Assignments**: Staff-to-shift allocations

#### Staff Operations
- **Swap Requests**: Staff-initiated shift exchanges
- **Holiday Requests**: Time-off requests with approval workflow
- **Time Entries**: Clock-in/out records for payroll

## Data Flow Architecture

### Frontend → Backend Communication
```
React Components → React Query → API Client → Express Routes → Storage Interface → MemStorage
```

### Key Patterns
1. **Query Management**: React Query handles caching and server state
2. **Form Validation**: Zod schemas shared between client/server
3. **Tenant Isolation**: All data filtered by `tenantId`
4. **Role-Based Access**: Different data views for owners vs staff

## Current Limitations

### 🚨 Critical Data Persistence Issue
**Problem**: Server restarts occur during page navigation in Replit environment
**Impact**: 
- Business Settings changes disappear when navigating to other pages
- Job roles added don't appear in Create Shift dropdowns
- All user data resets to sample defaults
- Cross-module data relationships break

### Example User Journey (Broken)
1. Owner adds new job role "Senior Developer" in Business Settings ✅
2. Role appears in Business Settings table ✅  
3. Owner navigates to Create Shift page ❌ (server restarts)
4. Create Shift dropdown only shows original sample roles ❌
5. "Senior Developer" role has disappeared ❌

## Sample Data Currently Loaded

### Default Users (Reset on Every Restart)
- **Owner**: john.doe@company.com (Business management access)
- **Staff**: jane.smith@company.com (Personal scheduling access)

### Business Data Defaults
- **Company**: "Acme Corporation" with basic profile
- **Job Roles**: Manager, Shift Supervisor, Cashier, Stock Associate
- **Locations**: Main Store, Warehouse, Customer Service
- **Departments**: Sales, Operations, Administration

### Sample Shifts & Operations
- **Shifts**: 5 sample shifts across different dates/times
- **Templates**: Morning, Evening, Weekend rotation patterns
- **Operating Hours**: Monday-Sunday 6AM-10PM default schedule

## API Endpoints (All Functional)

### Core Business Management
- `GET/POST/PUT/DELETE /api/job-roles` - Position management
- `GET/POST/PUT/DELETE /api/locations` - Site management  
- `GET/POST/PUT/DELETE /api/departments` - Org structure
- `GET/POST/PUT/DELETE /api/operating-hours` - Business hours
- `GET/POST/PUT /api/business-profiles` - Company settings

### Scheduling Operations
- `GET/POST/PUT/DELETE /api/shifts` - Shift management
- `GET/POST/PUT/DELETE /api/schedule-templates` - Template patterns
- `GET/POST/PUT/DELETE /api/opportunities` - Available shifts
- `GET/POST/PUT/DELETE /api/assignments` - Staff allocations

### Staff Services
- `GET/POST/PUT/DELETE /api/swap-requests` - Shift exchanges
- `GET/POST/PUT/DELETE /api/holiday-requests` - Time off
- `GET/POST/PUT/DELETE /api/time-entries` - Clock in/out

### User Management
- `GET/POST/PUT/DELETE /api/users` - User accounts
- `GET /api/users/staff/:tenantId` - Staff lists by business

## Role-Based Data Access

### Owner Role Access
- **Full CRUD**: All business data (job roles, locations, departments)
- **Staff Management**: View/edit all staff members
- **Reporting**: Analytics, time tracking, scheduling overview
- **Settings**: Business profile, operating hours, policies

### Staff Role Access  
- **Personal Shifts**: Own schedule and assignments
- **Opportunities**: Available shifts to claim
- **Requests**: Submit swap requests and holiday requests
- **Time Tracking**: Personal clock in/out functionality

## Multi-Tenant Data Isolation

### Tenant Scoping
- All data operations filtered by `tenantId` 
- Users can only access data within their business
- API endpoints enforce tenant-based security
- Sample data includes multiple tenant examples

### Data Relationships
```
Business Profile (tenantId) 
├── Users (staff members)
├── Job Roles (positions)
├── Locations (work sites)
├── Departments (org units)
├── Operating Hours (business schedule)
├── Shifts (individual assignments)
├── Schedule Templates (recurring patterns)
├── Opportunities (available work)
└── Staff Requests (swaps, holidays)
```

## Technical Implementation Details

### Database Schema (PostgreSQL Ready)
- **ORM**: Drizzle with full TypeScript integration
- **Migration**: Schema defined in `shared/schema.ts`
- **Validation**: Zod schemas for type safety
- **Relationships**: Foreign keys and constraints defined

### Frontend State Management
- **Server State**: React Query with caching
- **Form State**: React Hook Form with validation
- **Auth State**: React Context for role/tenant info
- **Navigation**: Wouter for client-side routing

### Development vs Production
- **Development**: MemStorage with sample data
- **Production Ready**: PostgreSQL connection configured
- **Migration Path**: Switch storage implementation in `server/storage.ts`

## Immediate Action Required

### Problem Resolution
The current in-memory storage creates a poor user experience where:
- Business configuration changes don't persist
- Cross-module data relationships break
- Users lose work when navigating between sections

### Solution Path
1. **Database Migration**: Switch from MemStorage to PostgreSQL
2. **Data Persistence**: Ensure all CRUD operations save to database
3. **Cross-Module Integration**: Job roles in Business Settings appear in Create Shift
4. **User Experience**: Seamless navigation without data loss

### Timeline Impact
- **Current State**: Functional UI with non-persistent data
- **After Migration**: Full persistence with professional data handling
- **User Testing**: Ready for real business data once migration complete

---

**Document Version**: 1.0  
**Last Updated**: July 2025  
**Status**: In-Memory Storage (Migration to PostgreSQL Required)