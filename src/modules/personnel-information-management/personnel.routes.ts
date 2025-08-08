import { Router } from 'express';
import { PersonnelController } from './personnel.controller';
import { requireRole, authMiddleware } from '../../shared/middleware/auth-middleware';

const router = Router();

// Get all personnel with pagination and filters
router.get('/', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.getAllPersonnel);

// Get personnel statistics
router.get('/stats', 
  authMiddleware, 
  requireRole(['Admin', 'HR']), 
  PersonnelController.getPersonnelStats
);

// Get comprehensive dashboard statistics
router.get('/dashboard-stats', 
  authMiddleware, 
  requireRole(['Admin', 'HR']), 
  PersonnelController.getDashboardStats
);

// Get personnel by ID
router.get('/:id', 
  authMiddleware, 
  requireRole(['Admin', 'HR']), 
  PersonnelController.getPersonnelById
);

// Create new personnel
router.post('/', 
  authMiddleware, 
  requireRole(['Admin', 'HR']), 
  PersonnelController.createPersonnel
);

// Update personnel
router.put('/:id', 
  authMiddleware, 
  requireRole(['Admin', 'HR']), 
  PersonnelController.updatePersonnel
);

// Delete personnel
router.delete('/:id', 
  authMiddleware, 
  requireRole(['Admin', 'HR']), 
  PersonnelController.deletePersonnel
);

// Employment History
router.get('/:id/employment-history', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.getEmploymentHistory);
router.post('/:id/employment-history', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.addEmploymentHistory);

// Membership Data
router.get('/:id/membership-data', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.getMembershipData);
router.patch('/:id/membership-data', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.updateMembershipData);

// Merits & Violations
router.get('/:id/merits-violations', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.getMeritsViolations);
router.post('/:id/merits-violations', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.addMeritViolation);

// Administrative Cases
router.get('/:id/admin-cases', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.getAdministrativeCases);
router.post('/:id/admin-cases', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.addAdministrativeCase);

// Personnel Movement
router.get('/:id/movements', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.getPersonnelMovements);
router.post('/:id/movements', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.addPersonnelMovement);

// Get simplified employee list for admin dashboard
router.get('/dashboard-employees', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.getDashboardEmployees);

// Upload multiple documents for a personnel (base64, no Multer)
router.post('/:id/documents', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.uploadDocuments);

// Get all documents for a personnel
router.get('/:id/documents', authMiddleware, requireRole(['Admin', 'HR']), PersonnelController.getDocuments);

export { router as personnelRoutes }; 