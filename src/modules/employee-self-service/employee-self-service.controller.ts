import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function mapPersonnelToUserProfile(personnel: any) {
  return {
    general: {
      firstName: personnel.first_name || '',
      middleName: personnel.middle_name || '',
      lastName: personnel.last_name || '',
      fullName: `${personnel.first_name || ''} ${personnel.last_name || ''}`.trim(),
      birthdate: personnel.date_of_birth ? new Date(personnel.date_of_birth).toLocaleDateString() : '',
      contactNumber: personnel.contact_number || '',
      address: personnel.address || '',
      email: personnel.user?.email || '',
      gender: personnel.gender || '',
      civilStatus: personnel.civil_status || '',
      citizenship: personnel.citizenship || '', // If you add this to schema/seed
    },
    employment: {
      employmentType: personnel.employment_type || '',
      designation: personnel.designation || '',
      department: personnel.department?.department_name || '',
      appointmentDate: personnel.date_hired ? new Date(personnel.date_hired).toLocaleDateString() : '',
      startDate: personnel.date_hired ? new Date(personnel.date_hired).toLocaleDateString() : '',
      employmentStatus: personnel.user?.status || '',
      jobLevel: personnel.job_level || '', // If you add this to schema/seed
      jobGrade: personnel.job_grade || '', // If you add this to schema/seed
    },
    membership: {
      gsis: personnel.gsis_number || '',
      pagibig: personnel.pagibig_number || '',
      philhealth: personnel.philhealth_number || '',
      sss: personnel.sss_number || '',
    },
    other: {
      dependents: personnel.dependents || '', // If you add this to schema/seed
      emergencyContactName: personnel.emergency_contact_name || '', // If you add this to schema/seed
      emergencyContactNumber: personnel.emergency_contact_number || '', // If you add this to schema/seed
      emergencyContactRelationship: personnel.emergency_contact_relationship || '', // If you add this to schema/seed
    },
  };
}

export const employeeSelfServiceController = {
  // GET /api/employee-self-service/my-profile - Get logged-in user's profile
  async getMyProfile(req: AuthenticatedRequest, res: Response) {
    try {
      // Assume req.user.id is set by auth middleware
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
      // Fetch personnel profile by userId
      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId },
        include: {
          department: true,
          user: true,
        },
      });
      if (!personnel) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }
      console.log('Personnel raw from DB:', personnel); // Dump raw personnel object
      const userProfile = mapPersonnelToUserProfile(personnel);
      res.json({
        success: true,
        data: userProfile,
        message: 'Profile fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message,
      });
    }
  },

  async updateMyProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const {
        firstName,
        middleName,
        lastName,
        birthdate,
        contactNumber,
        address,
        email,
        gender,
        civilStatus,
        // citizenship,
        employmentType,
        designation,
        department,
        appointmentDate,
        startDate,
        employmentStatus,
        jobLevel,
        jobGrade,
        gsis,
        pagibig,
        philhealth,
        sss
      } = req.body;
      // Update personnel and user
      const personnel = await prisma.personnel.findFirst({ where: { user_id: userId } });
      if (!personnel) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }
      // Find department_id if department name is provided
      let departmentId = undefined;
      if (department) {
        const dept = await prisma.department.findFirst({ where: { department_name: department } });
        if (dept) departmentId = dept.id;
      }
      // Update personnel fields
      const updatedPersonnel = await prisma.personnel.update({
        where: { id: personnel.id },
        data: {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          date_of_birth: birthdate ? new Date(birthdate) : null,
          contact_number: contactNumber,
          address: address,
          gender: gender,
          civil_status: civilStatus,
          employment_type: employmentType,
          designation: designation,
          department_id: departmentId,
          date_hired: appointmentDate ? new Date(appointmentDate) : null,
          gsis_number: gsis,
          pagibig_number: pagibig,
          philhealth_number: philhealth,
          sss_number: sss
        }
      });
      // Update user email if changed
      if (email) {
        await prisma.user.update({ where: { id: userId }, data: { email } });
      }
      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
  },

  // GET /api/employee-self-service/my-documents - Get user's documents
  async getMyDocuments(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId },
      });

      if (!personnel) {
        return res.status(404).json({
          success: false,
          message: 'Personnel not found',
        });
      }

      const documents = await prisma.employeeDocument.findMany({
        where: { personnelId: personnel.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: documents,
        message: 'Documents fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message,
      });
    }
  },

  // POST /api/employee-self-service/upload-document - Upload document
  async uploadDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId },
      });

      if (!personnel) {
        return res.status(404).json({
          success: false,
          message: 'Personnel not found',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const { title, description, category } = req.body;
      const file = req.file;

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Move file to uploads directory
      fs.renameSync(file.path, filePath);

      // Save document record to database
      const document = await prisma.employeeDocument.create({
        data: {
          personnelId: personnel.id,
          title,
          description: description || null,
          fileUrl: `/uploads/${fileName}`,
          fileType: file.mimetype,
          fileSize: file.size,
          category: category || 'Personal',
          isPrivate: false,
        },
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message,
      });
    }
  },

  // DELETE /api/employee-self-service/documents/:id - Delete document
  async deleteDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId },
      });

      if (!personnel) {
        return res.status(404).json({
          success: false,
          message: 'Personnel not found',
        });
      }

      const document = await prisma.employeeDocument.findFirst({
        where: {
          id,
          personnelId: personnel.id,
        },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../../../', document.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await prisma.employeeDocument.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message,
      });
    }
  },
}; 