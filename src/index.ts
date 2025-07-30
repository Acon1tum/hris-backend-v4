import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import modules
import { authRoutes } from './modules/auth/auth.routes';
import { personnelRoutes } from './modules/personnel-information-management/personnel.routes';
import { timekeepingRoutes } from './modules/timekeeping-attendance/timekeeping.routes';
import { leaveRoutes } from './modules/leave-management/leave.routes';
import { payrollRoutes } from './modules/payroll-management/payroll.routes';
import { recruitmentRoutes } from './modules/recruitment/recruitment.routes';
import { jobPortalRoutes } from './modules/online-job-application-portal/job-portal.routes';
import { performanceRoutes } from './modules/performance-management/performance.routes';
import { reportRoutes } from './modules/report-generation/report.routes';
import { systemRoutes } from './modules/system-administration/system.routes';
import { employeeSelfServiceRoutes } from './modules/employee-self-service/employee-self-service.routes';
import { healthWellnessRoutes } from './modules/health-wellness/health-wellness.routes';

// Import middleware
import { errorHandler } from './shared/middleware/error-handler';
import { notFoundHandler } from './shared/middleware/not-found-handler';
import { authMiddleware } from './shared/middleware/auth-middleware';

// Import types
import { Request, Response, NextFunction } from 'express';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Rate limiting
const isDevelopment = process.env.NODE_ENV === 'development';

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 20 : 5, // More lenient in development
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Use IP + username for more specific rate limiting
    return req.ip + ':' + (req.body?.username || 'unknown');
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
    });
  }
});

// More lenient rate limiting for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 300, // More lenient in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/health' || req.path.startsWith('/uploads/');
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Apply rate limiting to specific route groups
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter); // Apply general rate limiting to all other API routes

// API Routes (without global rate limiting since we apply it per route group)
app.use('/api/personnel', authMiddleware, personnelRoutes);
app.use('/api/timekeeping', authMiddleware, timekeepingRoutes);
app.use('/api/leave', authMiddleware, leaveRoutes);
app.use('/api/payroll', authMiddleware, payrollRoutes);
app.use('/api/recruitment', authMiddleware, recruitmentRoutes);
app.use('/api/job-portal', jobPortalRoutes); // Public routes for job applications
app.use('/api/performance', authMiddleware, performanceRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/system', authMiddleware, systemRoutes);
app.use('/api/employee-self-service', authMiddleware, employeeSelfServiceRoutes);
app.use('/api/health-wellness', authMiddleware, healthWellnessRoutes);

// Serve static files from /uploads with CORS and cross-origin headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, prisma }; 