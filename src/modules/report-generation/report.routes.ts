import { Router } from 'express';

const router = Router();

// Placeholder routes for report generation module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Report Generation module - Coming soon'
  });
});

export { router as reportRoutes }; 