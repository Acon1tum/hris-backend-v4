import { Router } from 'express';

const router = Router();

// Placeholder routes for performance management module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Performance Management module - Coming soon'
  });
});

export { router as performanceRoutes }; 