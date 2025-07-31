import { Request, Response } from 'express';
import { PrismaClient, PostingStatus, ApplicationStatus, InterviewStatus, ExamStatus, Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../../types';

const prisma = new PrismaClient();

// Helper function to convert salary range ID to range value
function convertSalaryRangeIdToValue(salaryRangeId: string): string {
  const salaryRanges = [
    { id: '1', range: '₱15,000 - ₱25,000', min: 15000, max: 25000 },
    { id: '2', range: '₱25,000 - ₱35,000', min: 25000, max: 35000 },
    { id: '3', range: '₱35,000 - ₱45,000', min: 35000, max: 45000 },
    { id: '4', range: '₱45,000 - ₱55,000', min: 45000, max: 55000 },
    { id: '5', range: '₱55,000 - ₱65,000', min: 55000, max: 65000 },
    { id: '6', range: '₱65,000 - ₱75,000', min: 65000, max: 75000 },
    { id: '7', range: '₱75,000 - ₱85,000', min: 75000, max: 85000 },
    { id: '8', range: '₱85,000 - ₱95,000', min: 85000, max: 95000 },
    { id: '9', range: '₱95,000 - ₱105,000', min: 95000, max: 105000 },
    { id: '10', range: '₱105,000+', min: 105000, max: null }
  ];
  
  const selectedRange = salaryRanges.find(range => range.id === salaryRangeId);
  return selectedRange ? selectedRange.range : salaryRangeId;
}

class JobPortalManagementController {
  // ========================================
  // JOB POSTING MANAGEMENT
  // ========================================

  // Create new job posting
  async createJobPosting(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        position_title,
        department_id,
        job_description,
        qualifications,
        technical_competencies,
        salary_range,
        employment_type,
        num_vacancies,
        application_deadline,
        posting_status = 'Draft'
      } = req.body;

      // Validation
      if (!position_title || !department_id || !job_description || !qualifications) {
        return res.status(400).json({
          success: false,
          message: 'Position title, department, job description, and qualifications are required'
        });
      }

      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id: department_id }
      });

      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department not found'
        });
      }

      // Convert salary range ID to actual range value
      let salaryRangeValue = salary_range;
      if (salary_range && salary_range !== '') {
        salaryRangeValue = convertSalaryRangeIdToValue(salary_range);
      }

      // Create job posting
      const jobPosting = await prisma.jobPosting.create({
        data: {
          position_title,
          department_id,
          job_description,
          qualifications,
          technical_competencies,
          salary_range: salaryRangeValue,
          employment_type,
          num_vacancies: num_vacancies || 1,
          application_deadline: new Date(application_deadline),
          posting_status,
          created_by: req.user?.id || '' // From auth middleware
        },
        include: {
          department: {
            select: {
              id: true,
              department_name: true
            }
          },
          created_by_user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        data: jobPosting,
        message: 'Job posting created successfully'
      });

    } catch (error: any) {
      console.error('Create job posting error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create job posting',
        error: error.message
      });
    }
  }

  // Get all job postings (admin view)
  async getAllJobPostings(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 10, status, department_id, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: Prisma.JobPostingWhereInput = {};
      
      if (status) {
        where.posting_status = status as PostingStatus;
      }
      
      if (department_id) {
        where.department_id = department_id as string;
      }
      
      if (search) {
        where.OR = [
          { position_title: { contains: search as string, mode: 'insensitive' } },
          { job_description: { contains: search as string, mode: 'insensitive' } },
          { qualifications: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // Get job postings with pagination
      const [jobPostings, total] = await Promise.all([
        prisma.jobPosting.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            department: {
              select: {
                id: true,
                department_name: true
              }
            },
            created_by_user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            },
            _count: {
              select: {
                job_applications: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }),
        prisma.jobPosting.count({ where })
      ]);

      const pages = Math.ceil(total / Number(limit));

      return res.json({
        success: true,
        data: jobPostings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages
        },
        message: 'Job postings retrieved successfully'
      });

    } catch (error: any) {
      console.error('Get job postings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve job postings',
        error: error.message
      });
    }
  }

  // Get specific job posting
  async getJobPosting(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const jobPosting = await prisma.jobPosting.findUnique({
        where: { id },
        include: {
          department: {
            select: {
              id: true,
              department_name: true
            }
          },
          created_by_user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          job_applications: {
            include: {
              applicant: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          _count: {
            select: {
              job_applications: true
            }
          }
        }
      });

      if (!jobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      return res.json({
        success: true,
        data: jobPosting,
        message: 'Job posting retrieved successfully'
      });

    } catch (error: any) {
      console.error('Get job posting error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve job posting',
        error: error.message
      });
    }
  }

  // Update job posting
  async updateJobPosting(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('Updating job posting:', id, 'with data:', updateData);

      // Check if job posting exists
      const existingJobPosting = await prisma.jobPosting.findUnique({
        where: { id }
      });

      if (!existingJobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      // Validate required fields if they're being updated
      if (updateData.position_title !== undefined && !updateData.position_title) {
        return res.status(400).json({
          success: false,
          message: 'Position title is required'
        });
      }

      if (updateData.department_id !== undefined) {
        // Check if department exists
        const department = await prisma.department.findUnique({
          where: { id: updateData.department_id }
        });

        if (!department) {
          return res.status(400).json({
            success: false,
            message: 'Department not found'
          });
        }
      }

      // Convert salary range ID to actual range value if it's being updated
      if (updateData.salary_range && updateData.salary_range !== '') {
        updateData.salary_range = convertSalaryRangeIdToValue(updateData.salary_range);
      }

      // Prepare the update data, excluding fields that shouldn't be updated
      const dataToUpdate: any = {
        position_title: updateData.position_title,
        department_id: updateData.department_id,
        job_description: updateData.job_description,
        qualifications: updateData.qualifications,
        technical_competencies: updateData.technical_competencies,
        salary_range: updateData.salary_range,
        employment_type: updateData.employment_type,
        num_vacancies: updateData.num_vacancies,
        application_deadline: updateData.application_deadline ? new Date(updateData.application_deadline) : undefined,
        posting_status: updateData.posting_status
      };

      // Remove undefined values
      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === undefined) {
          delete dataToUpdate[key];
        }
      });

      console.log('Final update data:', dataToUpdate);

      // Update job posting
      const updatedJobPosting = await prisma.jobPosting.update({
        where: { id },
        data: dataToUpdate,
        include: {
          department: {
            select: {
              id: true,
              department_name: true
            }
          },
          created_by_user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      console.log('Job posting updated successfully:', updatedJobPosting);

      return res.json({
        success: true,
        data: updatedJobPosting,
        message: 'Job posting updated successfully'
      });

    } catch (error: any) {
      console.error('Update job posting error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update job posting',
        error: error.message
      });
    }
  }

  // Update job posting status
  async updateJobPostingStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['Draft', 'Published', 'Closed', 'Filled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (Draft, Published, Closed, Filled)'
        });
      }

      // Check if job posting exists
      const existingJobPosting = await prisma.jobPosting.findUnique({
        where: { id }
      });

      if (!existingJobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      // Update status
      const updatedJobPosting = await prisma.jobPosting.update({
        where: { id },
        data: { posting_status: status as PostingStatus },
        include: {
          department: {
            select: {
              id: true,
              department_name: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: updatedJobPosting,
        message: `Job posting status updated to ${status}`
      });

    } catch (error: any) {
      console.error('Update job posting status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update job posting status',
        error: error.message
      });
    }
  }

  // Delete job posting
  async deleteJobPosting(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if job posting exists
      const existingJobPosting = await prisma.jobPosting.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              job_applications: true
            }
          }
        }
      });

      if (!existingJobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      // Check if there are applications
      if (existingJobPosting._count.job_applications > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete job posting with existing applications'
        });
      }

      // Delete job posting
      await prisma.jobPosting.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Job posting deleted successfully'
      });

    } catch (error: any) {
      console.error('Delete job posting error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete job posting',
        error: error.message
      });
    }
  }

  // ========================================
  // APPLICATION MANAGEMENT
  // ========================================

  // Get all applications
  async getAllApplications(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 10, status, job_id, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: Prisma.JobApplicationWhereInput = {};
      
      if (status) {
        where.status = status as ApplicationStatus;
      }
      
      if (job_id) {
        where.position_id = job_id as string;
      }
      
      if (search) {
        where.applicant = {
          OR: [
            { first_name: { contains: search as string, mode: 'insensitive' } },
            { last_name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } }
          ]
        };
      }

      // Get applications with pagination
      const [applications, total] = await Promise.all([
        prisma.jobApplication.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            applicant: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                current_employer: true,
                highest_education: true
              }
            },
            position: {
              select: {
                id: true,
                position_title: true,
                department: {
                  select: {
                    id: true,
                    department_name: true
                  }
                }
              }
            },
            _count: {
              select: {
                application_documents: true,
                interview_schedules: true,
                examination_schedules: true,
                assessments: true
              }
            }
          },
          orderBy: { application_date: 'desc' }
        }),
        prisma.jobApplication.count({ where })
      ]);

      const pages = Math.ceil(total / Number(limit));

      return res.json({
        success: true,
        data: applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages
        },
        message: 'Applications retrieved successfully'
      });

    } catch (error: any) {
      console.error('Get applications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve applications',
        error: error.message
      });
    }
  }

  // Get specific application
  async getApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const application = await prisma.jobApplication.findUnique({
        where: { id },
        include: {
          applicant: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              current_employer: true,
              highest_education: true,
              resume_path: true
            }
          },
          position: {
            select: {
              id: true,
              position_title: true,
              department: {
                select: {
                  id: true,
                  department_name: true
                }
              }
            }
          },
          application_documents: true,
          interview_schedules: {
            include: {
              interviewer: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          },
          examination_schedules: {
            include: {
              examiner: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          },
          assessments: {
            include: {
              assessor: {
                select: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      return res.json({
        success: true,
        data: application,
        message: 'Application retrieved successfully'
      });

    } catch (error: any) {
      console.error('Get application error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve application',
        error: error.message
      });
    }
  }

  // Update application status
  async updateApplicationStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      if (!status || !['Pending', 'Pre_Screening', 'For_Interview', 'For_Examination', 'Shortlisted', 'Selected', 'Rejected', 'Withdrawn', 'Hired'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required'
        });
      }

      // Check if application exists
      const existingApplication = await prisma.jobApplication.findUnique({
        where: { id }
      });

      if (!existingApplication) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Update status
      const updatedApplication = await prisma.jobApplication.update({
        where: { id },
        data: { 
          status: status as ApplicationStatus,
          remarks: remarks || existingApplication.remarks
        },
        include: {
          applicant: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          position: {
            select: {
              id: true,
              position_title: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: updatedApplication,
        message: `Application status updated to ${status}`
      });

    } catch (error: any) {
      console.error('Update application status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update application status',
        error: error.message
      });
    }
  }

  // ========================================
  // DASHBOARD & ANALYTICS
  // ========================================

  // Get dashboard data
  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      // Get various statistics
      const [
        totalJobPostings,
        activeJobPostings,
        totalApplications,
        pendingApplications,
        upcomingInterviews,
        recentApplications
      ] = await Promise.all([
        prisma.jobPosting.count(),
        prisma.jobPosting.count({ where: { posting_status: 'Published' } }),
        prisma.jobApplication.count(),
        prisma.jobApplication.count({ where: { status: 'Pending' } }),
        prisma.interviewSchedule.count({ 
          where: { 
            interview_status: 'Scheduled',
            interview_date: { gte: new Date() }
          }
        }),
        prisma.jobApplication.findMany({
          take: 5,
          orderBy: { application_date: 'desc' },
          include: {
            applicant: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            },
            position: {
              select: {
                position_title: true
              }
            }
          }
        })
      ]);

      return res.json({
        success: true,
        data: {
          statistics: {
            totalJobPostings,
            activeJobPostings,
            totalApplications,
            pendingApplications,
            upcomingInterviews
          },
          recentApplications
        },
        message: 'Dashboard data retrieved successfully'
      });

    } catch (error: any) {
      console.error('Get dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error.message
      });
    }
  }

  // ========================================
  // UTILITY ENDPOINTS
  // ========================================

  // Get departments for job posting
  async getDepartments(req: AuthenticatedRequest, res: Response) {
    try {
      const departments = await prisma.department.findMany({
        select: {
          id: true,
          department_name: true,
          description: true
        },
        orderBy: { department_name: 'asc' }
      });

      return res.json({
        success: true,
        data: departments,
        message: 'Departments retrieved successfully'
      });

    } catch (error: any) {
      console.error('Get departments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve departments',
        error: error.message
      });
    }
  }

  // Get salary ranges
  async getSalaryRanges(req: AuthenticatedRequest, res: Response) {
    try {
      // This could be moved to a separate table in the future
      const salaryRanges = [
        { id: '1', range: '₱15,000 - ₱25,000', min: 15000, max: 25000 },
        { id: '2', range: '₱25,000 - ₱35,000', min: 25000, max: 35000 },
        { id: '3', range: '₱35,000 - ₱45,000', min: 35000, max: 45000 },
        { id: '4', range: '₱45,000 - ₱55,000', min: 45000, max: 55000 },
        { id: '5', range: '₱55,000 - ₱65,000', min: 55000, max: 65000 },
        { id: '6', range: '₱65,000 - ₱75,000', min: 65000, max: 75000 },
        { id: '7', range: '₱75,000 - ₱85,000', min: 75000, max: 85000 },
        { id: '8', range: '₱85,000 - ₱95,000', min: 85000, max: 95000 },
        { id: '9', range: '₱95,000 - ₱105,000', min: 95000, max: 105000 },
        { id: '10', range: '₱105,000+', min: 105000, max: null }
      ];

      return res.json({
        success: true,
        data: salaryRanges,
        message: 'Salary ranges retrieved successfully'
      });

    } catch (error: any) {
      console.error('Get salary ranges error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve salary ranges',
        error: error.message
      });
    }
  }
}

export const jobPortalManagementController = new JobPortalManagementController(); 