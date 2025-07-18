import { Router } from 'express';

const router = Router();

// Placeholder routes for health and wellness module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Health and Wellness module - Coming soon'
  });
});

export { router as healthWellnessRoutes }; 