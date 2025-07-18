import { Router } from 'express';
import { RolesController } from './roles.controller';
import { requireRole, authMiddleware } from '@/shared/middleware/auth-middleware';

const router = Router();

// List all available roles
router.get('/', authMiddleware, requireRole(['Admin']), RolesController.listRoles);

export { router as rolesRoutes }; 