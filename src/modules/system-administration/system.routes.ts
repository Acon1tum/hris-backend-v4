import { Router } from 'express';
import { usersRoutes } from './users/users.routes';
import { rolesRoutes } from './roles/roles.routes';
import { auditLogsRoutes } from './audit-logs/audit-logs.routes';
import { departmentsRoutes } from './departments/departments.routes';

const router = Router();

// Mount permissions management endpoints
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/departments', departmentsRoutes);

// Placeholder routes for system administration module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'System Administration module - API root'
  });
});

export { router as systemRoutes }; 