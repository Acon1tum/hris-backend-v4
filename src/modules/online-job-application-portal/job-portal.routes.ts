import { Router } from 'express';
import { jobPortalController } from './job-portal.controller';
import { authMiddleware } from '../../shared/middleware/auth-middleware';

const router = Router();

// Applicant Authentication & Profile
router.post('/register', jobPortalController.register.bind(jobPortalController));
router.post('/login', jobPortalController.login.bind(jobPortalController));
router.get('/profile', authMiddleware, jobPortalController.getProfile.bind(jobPortalController));
router.put('/profile', authMiddleware, jobPortalController.updateProfile.bind(jobPortalController));
router.get('/profile/completion-status', authMiddleware, jobPortalController.checkProfileCompletion.bind(jobPortalController));

// Job Listings (public)
router.get('/jobs', jobPortalController.listJobs.bind(jobPortalController));
router.get('/jobs/:id', jobPortalController.getJob.bind(jobPortalController));

// Job Application Process (require login)
router.post('/applications', authMiddleware, jobPortalController.startApplication.bind(jobPortalController));
router.post('/applications/:id/upload', authMiddleware, jobPortalController.uploadDocuments.bind(jobPortalController));
router.put('/applications/:id/answers', authMiddleware, jobPortalController.answerQuestions.bind(jobPortalController));
router.post('/applications/:id/submit', authMiddleware, jobPortalController.submitApplication.bind(jobPortalController));

// Application Summary & Status (require login)
router.get('/applications', authMiddleware, jobPortalController.listApplications.bind(jobPortalController));
router.get('/applications/:id', authMiddleware, jobPortalController.getApplication.bind(jobPortalController));

// Edit/Cancel Application (require login)
router.put('/applications/:id', authMiddleware, jobPortalController.editApplication.bind(jobPortalController));
router.delete('/applications/:id', authMiddleware, jobPortalController.cancelApplication.bind(jobPortalController));

// Notifications
router.post('/notifications', jobPortalController.notifyApplicant.bind(jobPortalController));

export { router as jobPortalRoutes }; 