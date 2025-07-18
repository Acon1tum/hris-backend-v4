# Leave Credit Adjustment Setup Guide

## Overview
This guide explains how to set up and use the Leave Credit Adjustment feature that allows administrators to adjust employee leave credits with proper audit trails.

## Prerequisites
- Backend server running
- Database connection configured
- User with `leave_balance_update` and `leave_balance_read` permissions

## Setup Steps

### 1. Run Database Migration
```bash
cd hris-backend-v2
npx prisma migrate dev --name add_leave_adjustments
npx prisma generate
```

### 2. Start the Backend Server
```bash
cd hris-backend-v2
npm run dev
```

### 3. Verify API Endpoints
The following endpoints should be available:
- `POST /api/leave/adjustments` - Create leave credit adjustment
- `GET /api/leave/adjustments` - Get all adjustments with filters
- `GET /api/leave/adjustments/:personnel_id` - Get specific employee's adjustments

### 4. Test the Feature
1. Navigate to the Leave Balance page in the frontend
2. Click "Adjust Credits" button
3. Fill out the form with:
   - Employee selection
   - Leave type
   - Adjustment type (Credit/Debit)
   - Amount
   - Reason (minimum 10 characters)
4. Submit to create the adjustment

## Feature Overview

### Form Fields
- **Employee**: Select from all employees with leave balances
- **Leave Type**: Dynamically populated based on selected employee
- **Year**: Year for the adjustment (defaults to current year)
- **Adjustment Type**: Credit (increase) or Debit (decrease)
- **Amount**: Positive number for adjustment amount
- **Reason**: Required detailed reason (minimum 10 characters)

### Validation Rules
- All fields are required
- Adjustment amount must be greater than 0
- For decrease adjustments: amount cannot exceed current balance
- Reason must be at least 10 characters
- Employee must have a leave balance for the selected leave type

### Audit Trail
Each adjustment creates a record with:
- Personnel ID and Leave Type
- Adjustment type and amount
- Previous balance and new balance
- Reason for adjustment
- Created by user and timestamp
- Year of adjustment

### History View
- Click the "History" button for any employee
- View all adjustments for that employee
- See date, leave type, adjustment type, amounts, balance changes
- View who made the adjustment and when

## API Usage

### Create Adjustment
```http
POST /api/leave/adjustments
Content-Type: application/json
Authorization: Bearer {token}

{
  "personnel_id": "uuid",
  "leave_type_id": "uuid", 
  "year": "2024",
  "adjustment_type": "increase",
  "adjustment_amount": 5.0,
  "reason": "Additional leave credits for overtime work"
}
```

### Get Adjustments
```http
GET /api/leave/adjustments?personnel_id=uuid&year=2024
Authorization: Bearer {token}
```

## Database Schema

### LeaveAdjustment Table
- `id` - Primary key
- `personnel_id` - Foreign key to Personnel
- `leave_type_id` - Foreign key to LeaveType
- `year` - Year of adjustment
- `adjustment_type` - "increase" or "decrease"
- `adjustment_amount` - Amount of adjustment
- `reason` - Reason for adjustment
- `previous_balance` - Balance before adjustment
- `new_balance` - Balance after adjustment
- `created_by` - User who created the adjustment
- `created_at` - Timestamp of creation

## Troubleshooting

### Common Issues
1. **Database Error**: Make sure the migration has been run
2. **Permission Error**: User needs `leave_balance_update` permission
3. **Connection Error**: Check backend server is running
4. **Validation Error**: Ensure all form fields are filled correctly

### Error Messages
- "Unable to connect to server" - Backend not running
- "Server error occurred" - Database migration not run
- "Access forbidden" - Insufficient permissions
- "Adjustment would result in negative balance" - Decrease amount too large

## Security Notes
- Only users with proper permissions can create adjustments
- All adjustments are logged with user attribution
- Audit trail cannot be modified once created
- Transactions ensure data consistency 