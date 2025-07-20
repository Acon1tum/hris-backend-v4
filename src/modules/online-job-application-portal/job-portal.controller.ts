import { Request, Response } from 'express';
import { PrismaClient, ApplicationStatus, PostingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

class JobPortalController {
  // Applicant Registration
  async register(req: Request, res: Response) {
    try {
      const { first_name, last_name, middle_name, email, phone, current_employer, highest_education, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      // Hash password
      const password_hash = await bcrypt.hash(password, 10);
      // Create user with role 'Applicant'
      const user = await prisma.user.create({
        data: {
          username: email,
          email,
          password_hash,
          status: 'Active',
          role: 'Applicant'
        }
      });
      // Create JobApplicant linked to user
      const applicant = await prisma.jobApplicant.create({
        data: {
          user_id: user.id,
          first_name,
          last_name,
          middle_name,
          email,
          phone,
          current_employer,
          highest_education
        }
      });
      return res.json({ success: true, data: applicant });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Registration failed', error: error.message });
    }
  }

  // Applicant Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }
      // Find applicant profile
      const applicant = await prisma.jobApplicant.findFirst({ where: { user_id: user.id } });
      if (!applicant) {
        return res.status(404).json({ success: false, message: 'Applicant profile not found' });
      }
      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: 'applicant' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
      return res.json({ success: true, token, data: applicant });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Login failed', error: error.message });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const { applicantId } = req.query;
      if (!applicantId) return res.status(400).json({ success: false, message: 'Missing applicantId' });
      const applicant = await prisma.jobApplicant.findUnique({ where: { id: String(applicantId) } });
      if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
      return res.json({ success: true, data: applicant });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Get profile failed', error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const { applicantId } = req.query;
      if (!applicantId) return res.status(400).json({ success: false, message: 'Missing applicantId' });
      const update = req.body;
      const applicant = await prisma.jobApplicant.update({ where: { id: String(applicantId) }, data: update });
      return res.json({ success: true, data: applicant });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Update profile failed', error: error.message });
    }
  }

  async checkProfileCompletion(req: Request, res: Response) {
    try {
      const { applicantId } = req.query;
      if (!applicantId) return res.status(400).json({ success: false, message: 'Missing applicantId' });
      const applicant = await prisma.jobApplicant.findUnique({ where: { id: String(applicantId) } });
      if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
      // Check required fields directly
      const isComplete = Boolean(applicant.first_name && applicant.last_name && applicant.email && applicant.phone);
      return res.json({ success: true, complete: isComplete });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Check profile failed', error: error.message });
    }
  }

  // Job Listings
  async listJobs(req: Request, res: Response) {
    try {
      const { keywords, department, salary_range } = req.query;
      
      let whereClause: any = { posting_status: PostingStatus.Published };
      
      // Filter by keywords (search in position_title, job_description, qualifications)
      if (keywords && typeof keywords === 'string' && keywords.trim()) {
        whereClause.OR = [
          { position_title: { contains: keywords.trim(), mode: 'insensitive' } },
          { job_description: { contains: keywords.trim(), mode: 'insensitive' } },
          { qualifications: { contains: keywords.trim(), mode: 'insensitive' } }
        ];
      }
      
      // Filter by department
      if (department && typeof department === 'string' && department !== 'All') {
        whereClause.department = {
          department_name: { equals: department, mode: 'insensitive' }
        };
      }
      
      // Filter by salary range
      if (salary_range && typeof salary_range === 'string' && salary_range.trim()) {
        whereClause.salary_range = { equals: salary_range.trim() };
      }

      const jobs = await prisma.jobPosting.findMany({
        where: whereClause,
        include: { department: true },
        orderBy: { created_at: 'desc' }
      });
      
      return res.json({ success: true, data: jobs });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch jobs', error: error.message });
    }
  }

  async getJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const job = await prisma.jobPosting.findUnique({ where: { id: String(id) } });
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
      return res.json({ success: true, data: job });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch job', error: error.message });
    }
  }

  async getSalaryRanges(req: Request, res: Response) {
    try {
      const salaryRanges = await prisma.jobPosting.findMany({
        where: { 
          posting_status: PostingStatus.Published,
          salary_range: { not: null }
        },
        select: { salary_range: true },
        distinct: ['salary_range']
      });

      const ranges = salaryRanges
        .map(job => job.salary_range)
        .filter(range => range && range.trim() !== '')
        .sort();

      return res.json({ success: true, data: ranges });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch salary ranges', error: error.message });
    }
  }

  async getDepartments(req: Request, res: Response) {
    try {
      const departments = await prisma.department.findMany({
        where: {
          job_postings: {
            some: {
              posting_status: PostingStatus.Published
            }
          }
        },
        select: { department_name: true },
        orderBy: { department_name: 'asc' }
      });

      const departmentNames = departments.map(dept => dept.department_name);
      return res.json({ success: true, data: departmentNames });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message });
    }
  }

  // Job Application Process
  async startApplication(req: Request, res: Response) {
    try {
      const { position_id, applicant_id, cover_letter } = req.body;
      const application = await prisma.jobApplication.create({
        data: { position_id, applicant_id, cover_letter }
      });
      return res.json({ success: true, data: application });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Start application failed', error: error.message });
    }
  }

  // --- Job Application Process ---
  async uploadDocuments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { document_type, document_path } = req.body; // Accept 
      // 64 or file path for now
      if (!document_type || !document_path) {
        return res.status(400).json({ success: false, message: 'Missing document_type or document_path' });
      }
      // Save document record
      const doc = await prisma.applicationDocument.create({
        data: {
          application_id: String(id),
          document_type,
          document_path
        }
      });
      return res.json({ success: true, data: doc });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Upload failed', error: error.message });
    }
  }

  async answerQuestions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { answers } = req.body; // Accept as JSON or array
      if (!answers) {
        return res.status(400).json({ success: false, message: 'Missing answers' });
      }
      // Save answers in remarks field (or add a new field if needed)
      const application = await prisma.jobApplication.update({
        where: { id: String(id) },
        data: { remarks: typeof answers === 'string' ? answers : JSON.stringify(answers) }
      });
      return res.json({ success: true, data: application });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Answer questions failed', error: error.message });
    }
  }

  async submitApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Optionally: validate required docs/answers
      const application = await prisma.jobApplication.update({
        where: { id: String(id) },
        data: { status: ApplicationStatus.Pre_Screening }
      });
      return res.json({ success: true, data: application });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Submit application failed', error: error.message });
    }
  }

  // Application Summary & Status
  async listApplications(req: Request, res: Response) {
    try {
      const { applicantId } = req.query;
      if (!applicantId) return res.status(400).json({ success: false, message: 'Missing applicantId' });
      const applications = await prisma.jobApplication.findMany({
        where: { applicant_id: String(applicantId) },
        orderBy: { application_date: 'desc' }
      });
      return res.json({ success: true, data: applications });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch applications', error: error.message });
    }
  }

  async getApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const application = await prisma.jobApplication.findUnique({ where: { id: String(id) } });
      if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
      return res.json({ success: true, data: application });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch application', error: error.message });
    }
  }

  // Edit/Cancel Application
  async editApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const update = req.body;
      const application = await prisma.jobApplication.update({ where: { id: String(id) }, data: update });
      return res.json({ success: true, data: application });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Edit application failed', error: error.message });
    }
  }

  async cancelApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const application = await prisma.jobApplication.update({
        where: { id: String(id) },
        data: { status: ApplicationStatus.Withdrawn, withdrawn_date: new Date() }
      });
      return res.json({ success: true, data: application });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Cancel application failed', error: error.message });
    }
  }

  // Notifications
  async notifyApplicant(req: Request, res: Response) {
    try {
      const { applicant_id, message, notification_type } = req.body;
      if (!applicant_id || !message) {
        return res.status(400).json({ success: false, message: 'Missing applicant_id or message' });
      }
      // Save notification (stub: just save to Notification table)
      const notification = await prisma.notification.create({
        data: {
          user_id: applicant_id,
          message,
          notification_type: notification_type || 'Job Application',
        }
      });
      return res.json({ success: true, data: notification });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Notify failed', error: error.message });
    }
  }

  async createJobPosting(req: Request, res: Response) {
    try {
      const job = await prisma.jobPosting.create({ data: req.body });
      return res.json({ success: true, data: job });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Failed to create job posting', error: error.message });
    }
  }
}

export const jobPortalController = new JobPortalController(); 