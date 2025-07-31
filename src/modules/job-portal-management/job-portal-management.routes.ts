import { Router } from 'express';
import { jobPortalManagementController } from './job-portal-management.controller';
import { authMiddleware } from '../../shared/middleware/auth-middleware';
import { requireRole } from '../../shared/middleware/auth-middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ========================================
// JOB POSTING MANAGEMENT
// ========================================

// Create new job posting (Admin/HR only)
router.post('/jobs', requireRole(['Admin', 'HR']), jobPortalManagementController.createJobPosting.bind(jobPortalManagementController));

// Get all job postings (admin view)
router.get('/jobs', requireRole(['Admin', 'HR']), jobPortalManagementController.getAllJobPostings.bind(jobPortalManagementController));

// Get specific job posting
router.get('/jobs/:id', requireRole(['Admin', 'HR']), jobPortalManagementController.getJobPosting.bind(jobPortalManagementController));

// Update job posting
router.put('/jobs/:id', requireRole(['Admin', 'HR']), jobPortalManagementController.updateJobPosting.bind(jobPortalManagementController));

// Update job posting status
router.patch('/jobs/:id/status', requireRole(['Admin', 'HR']), jobPortalManagementController.updateJobPostingStatus.bind(jobPortalManagementController));

// Delete job posting
router.delete('/jobs/:id', requireRole(['Admin']), jobPortalManagementController.deleteJobPosting.bind(jobPortalManagementController));

// ========================================
// APPLICATION MANAGEMENT
// ========================================

// Get all applications
router.get('/applications', requireRole(['Admin', 'HR']), jobPortalManagementController.getAllApplications.bind(jobPortalManagementController));

// Get specific application
router.get('/applications/:id', requireRole(['Admin', 'HR']), jobPortalManagementController.getApplication.bind(jobPortalManagementController));

// Update application status
router.patch('/applications/:id/status', requireRole(['Admin', 'HR']), jobPortalManagementController.updateApplicationStatus.bind(jobPortalManagementController));

// ========================================
// DASHBOARD & ANALYTICS
// ========================================

// Get dashboard data
router.get('/dashboard', requireRole(['Admin', 'HR']), jobPortalManagementController.getDashboard.bind(jobPortalManagementController));

// ========================================
// UTILITY ENDPOINTS
// ========================================

// Get departments for job posting
router.get('/departments', requireRole(['Admin', 'HR']), jobPortalManagementController.getDepartments.bind(jobPortalManagementController));

// Get salary ranges
router.get('/salary-ranges', requireRole(['Admin', 'HR']), jobPortalManagementController.getSalaryRanges.bind(jobPortalManagementController));

export { router as jobPortalManagementRoutes }; 