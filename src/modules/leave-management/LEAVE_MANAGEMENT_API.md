# Leave Management API Documentation

This document outlines the comprehensive Leave Management API based on the actual Prisma schema implementation.

## Overview

The Leave Management Module provides a complete solution for managing employee leave requests, approvals, balances, and reporting. It integrates with your existing Personnel, Department, and User models.

## Database Models Used

- **LeaveType** - Types of leave available (Annual, Sick, etc.)
- **LeaveApplication** - Employee leave requests
- **LeaveBalance** - Track leave credits per employee/year/type
- **LeaveMonetization** - Convert leave credits to cash

## API Endpoints

### 🔐 Authentication & Permissions

All endpoints require appropriate authentication and permissions:
- `authMiddleware` - Basic authentication (logged-in users)
- `requirePermission('permission_name')` - Specific permissions from schema

### 📝 Leave Applications

#### 1. Get Leave Applications (Admin/HR View)
```
GET /api/leave/applications
Permission: leave_request_read
Query Parameters:
  - status: Pending|Approved|Rejected
  - leave_type_id: UUID of leave type
  - personnel_id: UUID of personnel
  - start_date: Filter from date (YYYY-MM-DD)
  - end_date: Filter to date (YYYY-MM-DD)
  - page: Page number (default: 1)
  - limit: Items per page (default: 10)

Response includes: personnel info, department, leave type details
```

#### 2. Get My Leave Applications (Employee View)
```
GET /api/leave/applications/my
Authentication: authMiddleware
Returns: User's own leave applications with leave type details
```

#### 3. Get Pending Applications
```
GET /api/leave/applications/pending
Permission: leave_request_read
Returns: All pending applications with personnel and leave type info
```

#### 4. Create Leave Application
```
POST /api/leave/applications
Permission: leave_request_create
Body:
{
  "leave_type_id": "uuid",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "reason": "string (optional)",
  "supporting_document": "string (optional)"
}

Note: total_days calculated automatically, personnel_id from authenticated user
```

#### 5. Update Leave Application
```
PUT /api/leave/applications/:id
Permission: leave_request_update
Body: Same as create
Note: Only pending applications can be updated by the owner
```

#### 6. Cancel Leave Application
```
DELETE /api/leave/applications/:id
Permission: leave_request_delete
Note: Only pending applications can be cancelled by the owner
```

#### 7. Approve Leave Application
```
PUT /api/leave/applications/:id/approve
Permission: leave_request_update
Body: {} (empty body)
Note: Automatically deducts from leave balance
```

#### 8. Reject Leave Application
```
PUT /api/leave/applications/:id/reject
Permission: leave_request_update
Body: {} (empty body)
```

### 📋 Leave Types Management

#### 9. Get Leave Types
```
GET /api/leave/types
Permission: leave_type_read
Returns: All active leave types ordered by name
```

#### 10. Create Leave Type
```
POST /api/leave/types
Permission: leave_type_create
Body:
{
  "leave_type_name": "string",
  "description": "string (optional)",
  "requires_document": boolean,
  "max_days": number (optional)
}
```

#### 11. Update Leave Type
```
PUT /api/leave/types/:id
Permission: leave_type_update
Body: Same as create + is_active: boolean
```

#### 12. Deactivate Leave Type
```
DELETE /api/leave/types/:id
Permission: leave_type_delete
Note: Soft delete (sets is_active to false)
```

### 💰 Leave Balance Management

#### 13. Get My Leave Balance
```
GET /api/leave/balance/my
Authentication: authMiddleware
Returns: Current user's leave balances for current year with leave type details
```

#### 14. Get Personnel Leave Balance
```
GET /api/leave/balance/:personnel_id
Permission: leave_balance_read
Query Parameters:
  - year: Year (default: current year)
Returns: Specific personnel's leave balances with personnel and leave type info
```

#### 15. Initialize Leave Balance
```
POST /api/leave/balance/initialize
Permission: leave_balance_create
Body:
{
  "personnel_id": "uuid",
  "leave_type_id": "uuid",
  "year": "string",
  "total_credits": number
}
Note: Uses upsert - creates new or updates existing balance
```

### 💸 Leave Monetization

#### 16. Get Leave Monetization Requests
```
GET /api/leave/monetization
Permission: leave_request_read
Query Parameters:
  - status: Pending|Approved|Rejected
  - personnel_id: Filter by personnel
  - page: Page number
  - limit: Items per page
```

#### 17. Create Leave Monetization Request
```
POST /api/leave/monetization
Permission: leave_request_create
Body:
{
  "leave_type_id": "uuid",
  "days_to_monetize": number
}
```

#### 18. Approve Leave Monetization
```
PUT /api/leave/monetization/:id/approve
Permission: leave_request_update
Body:
{
  "amount": number
}
```

### 📊 Leave Reports

#### 19. Get Leave Summary Report
```
GET /api/leave/reports/summary
Permission: leave_report_read
Query Parameters:
  - start_date: Report period start
  - end_date: Report period end
  - department_id: Filter by department
  - leave_type_id: Filter by leave type

Returns: Summary with counts by status, leave type, and department
```

#### 20. Get Leave Balance Report
```
GET /api/leave/reports/balance
Permission: leave_report_read
Query Parameters:
  - department_id: Filter by department
  - year: Report year (default: current year)

Returns: All personnel leave balances with department grouping
```

## Required Permissions (From Schema)

### Leave Request Permissions
- `leave_request_create` - Create leave applications and monetization
- `leave_request_read` - View leave applications and reports
- `leave_request_update` - Approve/reject applications
- `leave_request_delete` - Cancel leave applications

### Leave Type Permissions  
- `leave_type_create` - Create new leave types
- `leave_type_read` - View leave types
- `leave_type_update` - Update leave types
- `leave_type_delete` - Deactivate leave types

### Leave Balance Permissions
- `leave_balance_create` - Initialize leave balances
- `leave_balance_read` - View personnel leave balances
- `leave_balance_update` - Update leave balances
- `leave_balance_delete` - Delete leave balances

### Report Permissions
- `leave_report_read` - Generate and view reports
- `leave_report_generate` - Generate reports (if different from read)

## Response Format

All responses follow the standard format:

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  },
  "message": "Data fetched successfully"
}
```

## Database Schema Integration

### Leave Application Flow
1. Employee creates application → `LeaveApplication` record with status 'Pending'
2. Manager approves → Status changed to 'Approved', `LeaveBalance.used_credits` incremented
3. Manager rejects → Status changed to 'Rejected'

### Leave Balance Management
- Balances tracked per `personnel_id`, `leave_type_id`, and `year`
- Automatic deduction when applications approved
- Manual initialization and adjustments via API

### Data Relationships
- `LeaveApplication` → `Personnel` (employee who applied)
- `LeaveApplication` → `LeaveType` (type of leave)
- `LeaveBalance` → `Personnel` + `LeaveType` (balance tracking)
- `Personnel` → `User` (authentication link)
- `Personnel` → `Department` (organizational structure)

## Business Logic

### Automatic Calculations
- **Total Days**: Calculated from start_date to end_date (inclusive)
- **Leave Deduction**: Automatic when application approved
- **Balance Tracking**: Real-time updates to used_credits

### Validation Rules
- Only pending applications can be updated/cancelled
- Only application owners can update/cancel their applications
- Leave types must be active to be used
- Personnel must exist to create applications

## Key Differences from Generic APIs

✅ **Schema-Aligned**: Uses actual database models and relationships
✅ **Permission-Based**: Uses exact permissions from Prisma schema  
✅ **Real Data**: No placeholder data - full Prisma integration
✅ **Business Logic**: Automatic leave deduction and calculations
✅ **Error Handling**: Proper validation and constraint checking

## Implementation Features

- ✅ **Full CRUD Operations** on all leave entities
- ✅ **Automatic Leave Deduction** on approval
- ✅ **Real-time Balance Tracking** 
- ✅ **Comprehensive Filtering** and pagination
- ✅ **Multi-level Relationships** (Personnel → Department, etc.)
- ✅ **Leave Monetization** support
- ✅ **Detailed Reporting** with aggregations

Your Leave Management API is now **fully integrated** with your Prisma schema and ready for production use! 🎉 