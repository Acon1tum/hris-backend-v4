import { Router } from 'express';
import { LeaveController } from './leave.controller';
import { authMiddleware, requireRole } from '@/shared/middleware/auth-middleware';

const router = Router();

// Placeholder routes for leave management module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Leave Management module - API ready'
  });
});

// ==================== LEAVE APPLICATIONS ====================

// GET /api/leave/applications - Get leave applications with filters
router.get('/applications', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.getLeaveApplications
);

// GET /api/leave/applications/my - Get logged-in user's leave applications
router.get('/applications/my', 
  authMiddleware, requireRole(['Employee', 'Admin', 'HR']),
  LeaveController.getMyLeaveApplications
);

// GET /api/leave/applications/pending - Get pending applications for approval
router.get('/applications/pending', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.getPendingApplications
);

// POST /api/leave/applications - Create leave application
router.post('/applications', 
  authMiddleware, requireRole(['Employee', 'Admin', 'HR']),
  LeaveController.createLeaveApplication
);

// PUT /api/leave/applications/:id - Update leave application
router.put('/applications/:id', 
  authMiddleware, requireRole(['Employee', 'Admin', 'HR']),
  LeaveController.updateLeaveApplication
);

// DELETE /api/leave/applications/:id - Cancel leave application
router.delete('/applications/:id', 
  authMiddleware, requireRole(['Employee', 'Admin', 'HR']),
  LeaveController.cancelLeaveApplication
);

// PUT /api/leave/applications/:id/approve - Approve leave application
router.put('/applications/:id/approve', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.approveLeaveApplication
);

// PUT /api/leave/applications/:id/reject - Reject leave application
router.put('/applications/:id/reject', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.rejectLeaveApplication
);

// ==================== LEAVE TYPES ====================

// GET /api/leave/types - Get all leave types
router.get('/types', 
  authMiddleware, requireRole(['Admin', 'HR', 'Employee']),
  LeaveController.getLeaveTypes
);

// POST /api/leave/types - Create leave type
router.post('/types', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.createLeaveType
);

// PUT /api/leave/types/:id - Update leave type
router.put('/types/:id', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.updateLeaveType
);

// DELETE /api/leave/types/:id - Delete leave type
router.delete('/types/:id', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.deleteLeaveType
);

// ==================== LEAVE BALANCE ====================

// GET /api/leave/balance/my - Get logged-in user's leave balance
router.get('/balance/my', 
  authMiddleware, requireRole(['Employee', 'Admin', 'HR']),
  LeaveController.getMyLeaveBalance
);

// GET /api/leave/balance/:personnel_id - Get personnel's leave balance
router.get('/balance/:personnel_id', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.getPersonnelLeaveBalance
);

// POST /api/leave/balance/initialize - Initialize leave balances
router.post('/balance/initialize', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.initializeLeaveBalance
);

// ==================== LEAVE MONETIZATION ====================

// GET /api/leave/monetization - Get leave monetization requests
router.get('/monetization', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.getLeaveMonetization
);

// POST /api/leave/monetization - Create leave monetization request
router.post('/monetization', 
  authMiddleware, requireRole(['Employee', 'Admin', 'HR']),
  LeaveController.createLeaveMonetization
);

// PUT /api/leave/monetization/:id/approve - Approve leave monetization
router.put('/monetization/:id/approve', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.approveLeaveMonetization
);

// ==================== LEAVE REPORTS ====================

// GET /api/leave/reports/summary - Get leave summary report
router.get('/reports/summary', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.getLeaveSummaryReport
);

// GET /api/leave/reports/balance - Get leave balance report
router.get('/reports/balance', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.getLeaveBalanceReport
);

// ==================== LEAVE CREDIT ADJUSTMENTS ====================

// POST /api/leave/adjustments - Create leave credit adjustment
router.post('/adjustments', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.createLeaveAdjustment
);

// GET /api/leave/adjustments - Get leave credit adjustments
router.get('/adjustments', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.getLeaveAdjustments
);

// GET /api/leave/adjustments/:personnel_id - Get adjustments for specific personnel
router.get('/adjustments/:personnel_id', 
  authMiddleware, requireRole(['Admin', 'HR']),
  LeaveController.getPersonnelAdjustments
);

export { router as leaveRoutes }; 