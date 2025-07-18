import { Router } from 'express';

const router = Router();

// Placeholder routes for recruitment module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Recruitment module - Coming soon'
  });
});

export { router as recruitmentRoutes }; 