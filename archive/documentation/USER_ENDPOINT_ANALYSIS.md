# User Data Filtering Analysis Report

## Critical Issues Found (Tenant-Only Filtering - Should Be User-Filtered)

### 🚨 PROBLEM ENDPOINTS - Show ALL tenant data instead of user-specific data:

1. **GET /api/holiday-requests** (Line 491)
   - **Issue**: Uses `getHolidayRequestsByTenant(tenantId)` 
   - **Problem**: Staff see ALL holiday requests for entire company
   - **Should be**: User-specific filtering for staff, tenant-wide for owners

2. **GET /api/swap-requests** (Line 354)
   - **Issue**: Uses `getSwapRequestsByTenant(tenantId)`
   - **Problem**: Staff see ALL swap requests for entire company
   - **Should be**: User-specific filtering for staff, tenant-wide for owners

3. **GET /api/assignments** (Line 412)
   - **Issue**: Uses `getAssignmentsByTenant(tenantId)`
   - **Problem**: Shows ALL assignments in company
   - **Should be**: User-specific assignments for staff

## ✅ CORRECT ENDPOINTS - Proper User Filtering:

### User-Specific Data (Correctly Filtered):
1. **GET /api/my-shifts** (Line 261) ✓
   - Uses `getShiftsByUser(tenantId, userId)` - FIXED
   
2. **GET /api/staff/:userId/strikes** (Line 1456) ✓
   - Uses `getStaffStrikesByUser(tenantId, userId)`

3. **GET /api/time-entries** (Line 1366) ✓
   - Requires `userId` parameter and filters by user

4. **GET /api/time-entries/active** (Line 699) ✓
   - Requires `userId` parameter for specific user

5. **GET /api/holiday-entitlements** (Line 571) ✓
   - Owner endpoint - tenant filtering appropriate

## ✅ CORRECTLY TENANT-SCOPED (Appropriate for Business Data):

### These SHOULD show tenant-wide data:
1. **GET /api/shifts** (Line 79) ✓
   - Owner/admin view of all shifts - appropriate

2. **GET /api/opportunities** (Line 278) ✓
   - Open shifts available to ALL staff - appropriate

3. **GET /api/staff** (Line 203) ✓
   - Staff directory - appropriate for owner view

4. **GET /api/business-profile** (Line 740) ✓
   - Business settings - tenant-scoped appropriate

## 🎯 ROLE-AWARE ENDPOINTS NEEDED:

### These need conditional filtering based on user role:
1. **Holiday Requests**: Staff should see only their own, Owners see all
2. **Swap Requests**: Staff should see only relevant to them, Owners see all
3. **Assignments**: Staff should see only their assignments

## Summary:
- **3 Critical Issues** found where staff see company-wide data inappropriately
- **4 User-specific endpoints** working correctly
- **4 Business-wide endpoints** appropriately scoped
- Need to implement role-based conditional filtering for several endpoints