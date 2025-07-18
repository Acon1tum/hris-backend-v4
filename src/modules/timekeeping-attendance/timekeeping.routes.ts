import { Router } from 'express';

const router = Router();

// Placeholder routes for timekeeping and attendance module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Timekeeping and Attendance module - Coming soon'
  });
});

export { router as timekeepingRoutes }; 