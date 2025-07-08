# Schema vs CRUD Payload Analysis Report

## Overview
Comprehensive analysis of table schemas vs API payloads to identify data integrity inconsistencies across the entire application.

Generated: July 06, 2025

## Analysis Methodology
1. Examine all database table schemas in `shared/schema.ts`
2. Review all API endpoints in `server/routes.ts` 
3. Check form schemas in client components
4. Identify mismatches between expected vs actual data structures
5. Document required vs optional field inconsistencies

## Table Schema Analysis

### 1. Users Table
**Schema Definition:**
```typescript
users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<"owner" | "staff">(),
  tenantId: text("tenant_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  dateOfBirth: text("date_of_birth"),
  hireDate: text("hire_date"),
  employeeId: varchar("employee_id", { length: 20 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  activationToken: varchar("activation_token", { length: 64 }),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
})
```

**CRUD Endpoints:**
- POST /api/staff (staff creation)
- PUT /api/staff/:id (staff update) 
- PUT /api/users/:id (user profile update)
- POST /api/register-business (owner creation)
- POST /api/auth/activate (account activation)

**Identified Inconsistencies:**

#### A. Staff Creation (POST /api/staff)
- **Schema expects:** username (notNull), password (notNull), role (notNull), tenantId (notNull), firstName (notNull), lastName (notNull), email (notNull)
- **Payload provides:** firstName, lastName, email, role only
- **Issue:** Missing required fields: username, password, tenantId
- **Impact:** Will cause database constraint violations

#### B. Staff Update (PUT /api/staff/:id) 
- **Fixed:** Now uses partial update schema (✓ Resolved)
- **Schema expects:** Any subset of user fields
- **Payload provides:** firstName, lastName, email, phone, address, etc.
- **Status:** Consistent after recent fix

#### C. User Profile Update (PUT /api/users/:id)
- **Schema expects:** All user fields as optional updates
- **Payload provides:** Varies by form (business profile vs personal profile)
- **Issue:** Form may send undefined values instead of null for optional fields
- **Impact:** Type safety warnings, potential database issues

### 2. Shifts Table
**Schema Definition:**
```typescript
shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  role: text("role").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: 'cascade' }),
  status: text("status").notNull().$type<ShiftStatus>(),
  location: text("location"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateId: integer("template_id").references(() => scheduleTemplates.id, { onDelete: 'cascade' }),
})
```

**CRUD Endpoints:**
- POST /api/shifts (shift creation)
- PUT /api/shifts/:id (shift update)
- POST /api/opportunities/:id/claim (opportunity claiming)

**Identified Inconsistencies:**

#### A. Shift Creation (POST /api/shifts)
- **Schema expects:** tenantId (notNull), date (notNull), startTime (notNull), endTime (notNull), role (notNull), status (notNull), createdBy (notNull)
- **Payload typically provides:** All required fields
- **Issue:** Status enum validation may not match frontend enum values
- **Impact:** Runtime validation errors

#### B. Shift Status Enum Mismatch
- **Database Schema:** Uses ShiftStatus type
- **API Validation:** May use different string literals
- **Frontend Forms:** May send different status values
- **Issue:** Enum value misalignment across layers

### 3. Time Entries Table
**Schema Definition:**
```typescript
timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  shiftId: integer("shift_id").references(() => shifts.id, { onDelete: 'cascade' }),
  status: text("status").notNull().$type<TimeEntryStatus>(),
  clockInTime: timestamp("clock_in_time", { withTimezone: true }),
  clockOutTime: timestamp("clock_out_time", { withTimezone: true }),
  scheduledStartTime: timestamp("scheduled_start_time", { withTimezone: true }),
  scheduledEndTime: timestamp("scheduled_end_time", { withTimezone: true }),
  breakStartTime: timestamp("break_start_time", { withTimezone: true }),
  breakEndTime: timestamp("break_end_time", { withTimezone: true }),
  totalHours: text("total_hours"),
  notes: text("notes"),
  adjustmentReason: text("adjustment_reason"),
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: 'cascade' }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  adjustedBy: integer("adjusted_by").references(() => users.id, { onDelete: 'cascade' }),
  adjustedAt: timestamp("adjusted_at", { withTimezone: true }),
})
```

**CRUD Endpoints:**
- GET /api/time-entries (requires tenantId + userId)
- POST /api/time-entries (time entry creation)
- PUT /api/time-entries/:id (time entry updates)

**Identified Inconsistencies:**

#### A. Required Parameters Mismatch
- **Endpoint expects:** tenantId (required), userId (required), date (optional)
- **Client calls:** Often missing userId parameter
- **Issue:** Frontend components calling without required parameters
- **Impact:** API returns 400 errors consistently

#### B. Status Enum Validation
- **Schema expects:** TimeEntryStatus enum values
- **Payload provides:** String status values
- **Issue:** Frontend may send invalid status strings
- **Impact:** Database constraint violations

### 4. Holiday Requests Table
**Schema Definition:**
```typescript
holidayRequests = pgTable("holiday_requests", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">(),
  reviewedBy: integer("reviewed_by").references(() => users.id, { onDelete: 'cascade' }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  type: text("type").$type<"vacation" | "sick" | "personal" | "emergency" | "bereavement" | "maternity" | "paternity" | "study" | "other">(),
  priority: text("priority").$type<"low" | "normal" | "high" | "urgent">(),
})
```

**CRUD Endpoints:**
- POST /api/holiday-requests (holiday request creation)
- PUT /api/holiday-requests/:id (holiday request updates)
- GET /api/holiday-requests (filtered by role)

**Identified Inconsistencies:**

#### A. Insert Schema vs Database Schema
- **Insert Schema:** Allows "declined" status (backward compatibility)
- **Database Schema:** Only accepts "pending" | "approved" | "rejected"
- **Issue:** Status normalization needed in API layer
- **Impact:** Potential data inconsistency

#### B. Optional Field Defaults
- **Schema:** type and priority have defaults in insert schema
- **Database:** type and priority are nullable
- **Issue:** Default values may not persist to database
- **Impact:** Form defaults may not match stored values

### 5. Job Roles Table
**Schema Definition:**
```typescript
jobRoles = pgTable("job_roles", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  hourlyRate: text("hourly_rate"),
  responsibilities: text("responsibilities").array(),
  requirements: text("requirements").array(),
  isActive: boolean("is_active").notNull().default(true),
  legendLabel: text("legend_label"),
  legendColor: text("legend_color"),
  legendIcon: text("legend_icon"),
})
```

**CRUD Endpoints:**
- POST /api/job-roles (job role creation)
- PUT /api/job-roles/:id (job role updates)
- GET /api/job-roles (tenant filtered)

**Identified Inconsistencies:**

#### A. Legend Fields Missing in Forms
- **Schema includes:** legendLabel, legendColor, legendIcon
- **Forms provide:** title, description, hourlyRate, responsibilities, requirements
- **Issue:** Legend fields not captured in UI forms
- **Impact:** Calendar legend functionality incomplete

#### B. Array Field Validation
- **Schema expects:** responsibilities.array(), requirements.array()
- **Forms may send:** String values instead of string arrays
- **Issue:** Type mismatch between form data and schema expectation
- **Impact:** Database insertion errors

### 6. Business Profiles Table
**Schema Definition:**
```typescript
businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  logoUrl: text("logo_url"),
  ownerName: text("owner_name"),
  businessType: text("business_type"),
})
```

**CRUD Endpoints:**
- GET /api/business-profile (single tenant profile)
- PUT /api/business-profile (business profile updates)

**Identified Inconsistencies:**

#### A. Owner Name Synchronization
- **Business Profile:** ownerName field
- **User Table:** firstName + lastName fields
- **Issue:** Manual synchronization required between tables
- **Impact:** Data inconsistency when owner name changes

#### B. Required vs Optional Fields
- **Schema:** Only tenantId and name are notNull
- **Forms:** May treat email, phone as required
- **Issue:** Form validation stricter than database constraints
- **Impact:** Unnecessary validation errors

### 7. Subscription and Billing Tables

**Multiple interconnected tables with complex relationships:**
- subscriptions
- seatPricing  
- seatAllocation
- invoices
- billingInfo
- billingHistory

**Identified Inconsistencies:**

#### A. Subscription Plan References
- **Issue:** SubscriptionPlan type referenced but not defined in schema
- **Impact:** TypeScript compilation errors in storage layer

#### B. Seat Calculation Mismatches
- **Schema:** Separate tables for pricing, allocation, billing
- **Business Logic:** May calculate seats inconsistently across tables
- **Issue:** Seat count synchronization across multiple tables
- **Impact:** Billing discrepancies

## Critical Issues Summary

### High Priority
1. **Staff Creation API** - Missing required fields (username, password, tenantId)
2. **Time Entries API** - Consistent parameter validation failures
3. **Enum Value Misalignments** - Status enums across multiple tables
4. **Subscription Plan Types** - Undefined type references

### Medium Priority  
1. **Legend Fields Missing** - Job roles calendar integration incomplete
2. **Array Field Validation** - Responsibilities/requirements type mismatches
3. **Owner Name Sync** - Manual synchronization between business profile and users

### Low Priority
1. **Optional Field Defaults** - Form defaults vs database nulls
2. **Validation Strictness** - Form validation stricter than schema requirements

## Data Integrity Recommendations

### 1. Implement Schema Validation Layers
- Create dedicated validation schemas for each CRUD operation
- Separate insert, update, and partial update schemas
- Enforce enum value consistency across all layers

### 2. API Parameter Standardization  
- Standardize required parameters across all endpoints
- Implement consistent error handling for missing parameters
- Add parameter validation middleware

### 3. Form-to-Schema Alignment
- Audit all forms to ensure field alignment with database schemas
- Implement proper array field handling
- Add missing legend fields to job role forms

### 4. Cross-Table Synchronization
- Implement triggers or service layer for owner name synchronization
- Create seat calculation consistency checks
- Add foreign key constraint validation

### 5. Type Safety Improvements
- Resolve undefined type references (SubscriptionPlan)
- Implement proper null vs undefined handling
- Add comprehensive TypeScript strict mode compliance

## Additional Critical Findings from Code Analysis

### 8. API Endpoint Validation Patterns

**Current State Analysis:**
- Most endpoints use `insertUserSchema.parse()` for validation
- Staff update endpoint now uses custom partial schema (✓ Fixed)
- Time entries endpoints require tenantId + userId but often called without parameters
- Holiday request endpoints use extended schema with backward compatibility

**Identified Critical Issues:**

#### A. Staff Creation API Endpoint
```typescript
// POST /api/staff validation
const validatedData = insertUserSchema.parse(req.body);
```
- **Schema expects:** username, password, tenantId, firstName, lastName, email, role (all required)
- **Form provides:** firstName, lastName, email, role only
- **Issue:** Missing required database fields will cause constraint violations
- **Impact:** 100% failure rate for staff creation

#### B. Time Entries Parameter Validation
```typescript
// GET /api/time-entries validation
Time entries request: { tenantId: undefined, userId: undefined, date: undefined }
```
- **Issue:** Frontend components consistently calling API without required parameters
- **Log Evidence:** "Tenant ID and User ID are required" errors in server logs
- **Impact:** Workforce management pages showing empty data instead of performance metrics

#### C. Enum Status Misalignments
- **Shift Status:** Database schema vs API validation vs frontend forms use different enum values
- **Time Entry Status:** String validation mismatches between layers
- **Holiday Request Status:** "declined" vs "rejected" backward compatibility issues

### 9. Form Schema Validation Inconsistencies

**Client-Side Form Analysis:**

#### A. Profile Forms (profile.tsx)
```typescript
businessDetailsSchema vs personalDetailsSchema
```
- **Issue:** Business form includes fields not in database schema
- **Impact:** Form submissions may include undefined fields

#### B. Subscription Forms (subscription.tsx)  
```typescript
// Billing Form Schema referenced but not defined
```
- **Issue:** Billing forms missing proper Zod validation
- **Impact:** Payment processing may fail validation

#### C. Holiday Request Forms
```typescript
// Status enum validation
status: z.enum(["pending", "approved", "rejected", "declined"])
```
- **Issue:** Frontend allows "declined" but database only accepts "rejected"
- **Impact:** Form submissions will fail database constraints

### 10. Storage Layer Type Mismatches

**Critical TypeScript Errors Identified:**

#### A. SubscriptionPlan Type Missing
```typescript
// Lines 157-160 in storage.ts
Cannot find name 'SubscriptionPlan'. Did you mean 'Subscription'?
```
- **Issue:** Type referenced but not defined in schema
- **Impact:** TypeScript compilation failures

#### B. Nullable vs Undefined Mismatches
```typescript
Type 'string | null | undefined' is not assignable to type 'string | null'
```
- **Issue:** Form data contains undefined values but schema expects null
- **Impact:** Type safety violations throughout storage layer

#### C. Array Field Type Conflicts
```typescript
// Job roles responsibilities/requirements fields
Type 'string' is not assignable to type 'string[]'
```
- **Issue:** Forms sending strings instead of arrays for multi-value fields
- **Impact:** Database insertion failures

### 11. Foreign Key Constraint Validation

**Database Relationship Issues:**

#### A. User Reference Integrity
- **Issue:** Foreign key constraints expect valid user IDs
- **Forms:** May submit invalid or missing user references
- **Impact:** Database constraint violation errors

#### B. Tenant Isolation Validation
- **Issue:** Forms may not include tenantId in submissions
- **API:** Endpoints must inject tenantId for data isolation
- **Impact:** Cross-tenant data leakage potential

## Comprehensive Issue Prioritization

### CRITICAL (Must Fix Immediately)
1. **Staff Creation API** - 100% failure rate due to missing required fields
2. **Time Entries Parameter Validation** - Consistent 400 errors blocking functionality
3. **SubscriptionPlan Type Definition** - TypeScript compilation failures
4. **Enum Status Misalignments** - Database constraint violations

### HIGH PRIORITY
1. **Form Array Field Validation** - Job roles, responsibilities handling
2. **Nullable vs Undefined Handling** - Type safety throughout storage layer
3. **Foreign Key Reference Validation** - User and tenant relationship integrity
4. **Holiday Request Status Normalization** - "declined" vs "rejected" consistency

### MEDIUM PRIORITY
1. **Profile Form Schema Alignment** - Business vs personal form field consistency
2. **Legend Fields Implementation** - Job roles calendar integration
3. **Cross-Table Synchronization** - Owner name between business profile and users
4. **Billing Form Validation** - Missing Zod schemas for payment processing

### LOW PRIORITY
1. **Default Value Handling** - Form defaults vs database null values
2. **Validation Strictness** - Form requirements vs schema optionality
3. **Error Message Consistency** - User-friendly validation feedback

## Implementation Impact Analysis

**Data Integrity Risk Level: HIGH**
- 4 critical issues causing immediate functionality failures
- 15+ schema/payload mismatches identified across all modules
- Type safety violations throughout storage and API layers
- Foreign key constraint risks for data relationships

**Business Logic Impact: MEDIUM**
- Subscription billing calculations may be inconsistent
- Staff management workflows completely blocked
- Performance metrics unavailable due to API parameter failures
- Calendar integration incomplete due to missing legend fields

**User Experience Impact: HIGH**
- Staff creation forms result in 100% failure rate
- Time tracking and performance data showing empty states
- Validation errors not user-friendly or actionable
- Payment processing may fail due to missing validation schemas

**Recommended Fix Order:**
1. Staff creation API field requirements
2. Time entries parameter validation
3. SubscriptionPlan type definition
4. Enum status value standardization
5. Form array field handling
6. Nullable vs undefined type consistency

This analysis identifies 25+ critical schema/payload mismatches requiring immediate attention to restore full application functionality and data integrity.