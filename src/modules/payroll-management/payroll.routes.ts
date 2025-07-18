import { Router } from 'express';

const router = Router();

// Placeholder routes for payroll management module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payroll Management module - Coming soon'
  });
});

export { router as payrollRoutes }; 