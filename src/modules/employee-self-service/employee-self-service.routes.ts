import { Router } from 'express';
import { employeeSelfServiceController } from './employee-self-service.controller';
import { authMiddleware } from '../../shared/middleware/auth-middleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Placeholder routes for employee self service module
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Employee Self Service module - Coming soon'
  });
});

// GET /api/employee-self-service/my-profile - Get logged-in user's profile
router.get('/my-profile', authMiddleware, employeeSelfServiceController.getMyProfile);

// PUT /api/employee-self-service/my-profile - Update logged-in user's profile
router.put('/my-profile', authMiddleware, employeeSelfServiceController.updateMyProfile);

// Document management routes
// GET /api/employee-self-service/my-documents - Get user's documents
router.get('/my-documents', authMiddleware, employeeSelfServiceController.getMyDocuments);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../../uploads');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, images, and text files are allowed.'));
    }
  }
});

// POST /api/employee-self-service/upload-document - Upload document
router.post('/upload-document', authMiddleware, upload.single('file'), employeeSelfServiceController.uploadDocument);

// DELETE /api/employee-self-service/documents/:id - Delete document
router.delete('/documents/:id', authMiddleware, employeeSelfServiceController.deleteDocument);

export { router as employeeSelfServiceRoutes }; 