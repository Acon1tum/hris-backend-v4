import { Router } from 'express';
import { DepartmentsController } from './departments.controller';
import { requireRole, authMiddleware } from '@/shared/middleware/auth-middleware';

const router = Router();

// Get all departments
router.get('/', authMiddleware, requireRole(['Admin', 'HR']), DepartmentsController.getAllDepartments);
// Add other department routes as needed, all protected by requireRole(['Admin', 'HR'])

export { router as departmentsRoutes }; 