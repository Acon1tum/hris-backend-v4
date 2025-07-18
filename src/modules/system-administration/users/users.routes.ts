import { Router } from 'express';
import { UsersController } from './users.controller';
import { requireRole, authMiddleware } from '@/shared/middleware/auth-middleware';

const router = Router();

router.get('/', authMiddleware, requireRole(['Admin']), UsersController.listUsers);
router.get('/:id', authMiddleware, requireRole(['Admin']), UsersController.getUser);
router.post('/', authMiddleware, requireRole(['Admin']), UsersController.createUser);
router.put('/:id', authMiddleware, requireRole(['Admin']), UsersController.updateUser);
router.delete('/:id', authMiddleware, requireRole(['Admin']), UsersController.deleteUser);
router.patch('/:id/password', authMiddleware, requireRole(['Admin']), UsersController.changePassword);
router.patch('/:id/roles', authMiddleware, requireRole(['Admin']), UsersController.assignRoles);

export { router as usersRoutes }; 