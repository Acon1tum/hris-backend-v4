import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '@/shared/middleware/auth-middleware';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.post('/logout', authMiddleware, AuthController.logout);

export { router as authRoutes }; 