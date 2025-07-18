import { Router } from 'express';
import { AuditLogsController } from './audit-logs.controller';
import { requireRole, authMiddleware } from '@/shared/middleware/auth-middleware';

const router = Router();

router.get('/', authMiddleware, requireRole(['Admin']), AuditLogsController.listLogs);
router.get('/:id', authMiddleware, requireRole(['Admin']), AuditLogsController.getLog);

export { router as auditLogsRoutes }; 