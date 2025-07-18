import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/types';
import { CustomError } from '@/shared/middleware/error-handler';

const prisma = new PrismaClient();

export class LeaveController {
  // ==================== LEAVE APPLICATIONS ====================
  
  // GET /api/leave/applications - Get leave applications with filters
  static async getLeaveApplications(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        status, 
        leave_type_id, 
        personnel_id, 
        start_date, 
        end_date,
        page = 1, 
        limit = 10 
      } = req.query;

      console.log('getLeaveApplications called with filters:', { status, leave_type_id, personnel_id, start_date, end_date, page, limit });

      const where: any = {};
      
      // Filter by status
      if (status) where.status = status;
      
      // Filter by leave type
      if (leave_type_id) where.leave_type_id = leave_type_id;
      
      // Filter by personnel
      if (personnel_id) where.personnel_id = personnel_id;

      // Filter by date range
      if (start_date && end_date) {
        where.start_date = {
          gte: new Date(start_date as string),
          lte: new Date(end_date as string)
        };
      }

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [applications, total] = await Promise.all([
        prisma.leaveApplication.findMany({
          where,
          include: {
            personnel: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                department: {
                  select: {
                    id: true,
                    department_name: true
                  }
                }
              }
            },
            leave_type: true
          },
          skip,
          take,
          orderBy: {
            request_date: 'desc'
          }
        }),
        prisma.leaveApplication.count({ where })
      ]);

      console.log(`Found ${applications.length} leave applications, total count: ${total}`);

      res.json({
        success: true,
        data: applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        message: 'Leave applications fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching leave applications:', error);
      throw new CustomError('Failed to fetch leave applications', 500);
    }
  }

  // GET /api/leave/applications/my - Get logged-in user's leave applications
  static async getMyLeaveApplications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new CustomError('Unauthorized', 401);
      }

      // Find personnel record for this user
      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId }
      });

      if (!personnel) {
        throw new CustomError('Personnel record not found', 404);
      }

      const applications = await prisma.leaveApplication.findMany({
        where: { personnel_id: personnel.id },
        include: {
          leave_type: true
        },
        orderBy: {
          request_date: 'desc'
        }
      });

      res.json({
        success: true,
        data: applications,
        message: 'My leave applications fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching my leave applications:', error);
      throw new CustomError('Failed to fetch leave applications', 500);
    }
  }

  // GET /api/leave/applications/pending - Get pending applications
  static async getPendingApplications(req: AuthenticatedRequest, res: Response) {
    try {
      const applications = await prisma.leaveApplication.findMany({
        where: { status: 'Pending' },
        include: {
          personnel: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              department: {
                select: {
                  id: true,
                  department_name: true
                }
              }
            }
          },
          leave_type: true
        },
        orderBy: {
          request_date: 'asc'
        }
      });

      res.json({
        success: true,
        data: applications,
        message: 'Pending applications fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching pending applications:', error);
      throw new CustomError('Failed to fetch pending applications', 500);
    }
  }

  // POST /api/leave/applications - Create leave application
  static async createLeaveApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new CustomError('Unauthorized', 401);
      }

      // Find personnel record for this user
      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId }
      });

      if (!personnel) {
        throw new CustomError('Personnel record not found', 404);
      }

      const {
        leave_type_id,
        start_date,
        end_date,
        reason,
        supporting_document
      } = req.body;

      if (!leave_type_id || !start_date || !end_date) {
        throw new CustomError('Missing required fields', 400);
      }

      // Calculate total days
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const total_days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end dates

      const application = await prisma.leaveApplication.create({
        data: {
          personnel_id: personnel.id,
          leave_type_id,
          start_date: startDate,
          end_date: endDate,
          total_days,
          reason,
          supporting_document,
          status: 'Pending'
        },
        include: {
          leave_type: true
        }
      });

      res.status(201).json({
        success: true,
        data: application,
        message: 'Leave application created successfully'
      });
    } catch (error: any) {
      console.error('Error creating leave application:', error);
      throw new CustomError('Failed to create leave application', 500);
    }
  }

  // PUT /api/leave/applications/:id - Update leave application
  static async updateLeaveApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        throw new CustomError('Unauthorized', 401);
      }

      // Find personnel record for this user
      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId }
      });

      if (!personnel) {
        throw new CustomError('Personnel record not found', 404);
      }

      // Check if application exists and belongs to user
      const existingApplication = await prisma.leaveApplication.findFirst({
        where: { 
          id,
          personnel_id: personnel.id,
          status: 'Pending' // Only allow updates to pending applications
        }
      });

      if (!existingApplication) {
        throw new CustomError('Application not found or cannot be updated', 404);
      }

      const {
        leave_type_id,
        start_date,
        end_date,
        reason,
        supporting_document
      } = req.body;

      let total_days = existingApplication.total_days;
      
      // Recalculate total days if dates changed
      if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const timeDiff = endDate.getTime() - startDate.getTime();
        total_days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      }

      const application = await prisma.leaveApplication.update({
        where: { id },
        data: {
          leave_type_id,
          start_date: start_date ? new Date(start_date) : undefined,
          end_date: end_date ? new Date(end_date) : undefined,
          total_days,
          reason,
          supporting_document
        },
        include: {
          leave_type: true
        }
      });

      res.json({
        success: true,
        data: application,
        message: 'Leave application updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating leave application:', error);
      throw new CustomError('Failed to update leave application', 500);
    }
  }

  // DELETE /api/leave/applications/:id - Cancel leave application
  static async cancelLeaveApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        throw new CustomError('Unauthorized', 401);
      }

      // Find personnel record for this user
      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId }
      });

      if (!personnel) {
        throw new CustomError('Personnel record not found', 404);
      }

      // Check if application exists and belongs to user
      const existingApplication = await prisma.leaveApplication.findFirst({
        where: { 
          id,
          personnel_id: personnel.id,
          status: 'Pending' // Only allow cancellation of pending applications
        }
      });

      if (!existingApplication) {
        throw new CustomError('Application not found or cannot be cancelled', 404);
      }

      await prisma.leaveApplication.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Leave application cancelled successfully'
      });
    } catch (error: any) {
      console.error('Error cancelling leave application:', error);
      throw new CustomError('Failed to cancel leave application', 500);
    }
  }

  // PUT /api/leave/applications/:id/approve - Approve leave application
  static async approveLeaveApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const application = await prisma.leaveApplication.findUnique({
        where: { id },
        include: {
          personnel: true,
          leave_type: true
        }
      });

      if (!application) {
        throw new CustomError('Application not found', 404);
      }

      if (application.status !== 'Pending') {
        throw new CustomError('Application is not pending approval', 400);
      }

      // Update application status
      const updatedApplication = await prisma.leaveApplication.update({
        where: { id },
        data: { 
          status: 'Approved',
          approved_by: req.user?.id,
          approval_date: new Date(),
          approval_comments: comments
        }
      });

      // Deduct from leave balance
      const currentYear = new Date().getFullYear().toString();
      await prisma.leaveBalance.updateMany({
        where: {
          personnel_id: application.personnel_id,
          leave_type_id: application.leave_type_id,
          year: currentYear
        },
        data: {
          used_credits: {
            increment: application.total_days
          },
          last_updated: new Date()
        }
      });

      res.json({
        success: true,
        data: updatedApplication,
        message: 'Leave application approved successfully'
      });
    } catch (error: any) {
      console.error('Error approving leave application:', error);
      throw new CustomError('Failed to approve leave application', 500);
    }
  }

  // PUT /api/leave/applications/:id/reject - Reject leave application
  static async rejectLeaveApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const application = await prisma.leaveApplication.findUnique({
        where: { id }
      });

      if (!application) {
        throw new CustomError('Application not found', 404);
      }

      if (application.status !== 'Pending') {
        throw new CustomError('Application is not pending approval', 400);
      }

      const updatedApplication = await prisma.leaveApplication.update({
        where: { id },
        data: { 
          status: 'Rejected',
          approved_by: req.user?.id,
          approval_date: new Date(),
          approval_comments: comments
        }
      });

      res.json({
        success: true,
        data: updatedApplication,
        message: 'Leave application rejected successfully'
      });
    } catch (error: any) {
      console.error('Error rejecting leave application:', error);
      throw new CustomError('Failed to reject leave application', 500);
    }
  }

  // ==================== LEAVE TYPES ====================

  // GET /api/leave/types - Get all leave types
  static async getLeaveTypes(req: Request, res: Response) {
    try {
      const leaveTypes = await prisma.leaveType.findMany({
        orderBy: { leave_type_name: 'asc' }
      });

      res.json({
        success: true,
        data: leaveTypes,
        message: 'Leave types fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching leave types:', error);
      throw new CustomError('Failed to fetch leave types', 500);
    }
  }

  // POST /api/leave/types - Create leave type
  static async createLeaveType(req: Request, res: Response) {
    try {
      const {
        leave_type_name,
        description,
        requires_document,
        max_days
      } = req.body;

      if (!leave_type_name) {
        throw new CustomError('Leave type name is required', 400);
      }

      const leaveType = await prisma.leaveType.create({
        data: {
          leave_type_name,
          description,
          requires_document: requires_document || false,
          max_days,
          is_active: true
        }
      });

      res.status(201).json({
        success: true,
        data: leaveType,
        message: 'Leave type created successfully'
      });
    } catch (error: any) {
      console.error('Error creating leave type:', error);
      throw new CustomError('Failed to create leave type', 500);
    }
  }

  // PUT /api/leave/types/:id - Update leave type
  static async updateLeaveType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        leave_type_name,
        description,
        requires_document,
        max_days,
        is_active
      } = req.body;

      const leaveType = await prisma.leaveType.update({
        where: { id },
        data: {
          leave_type_name,
          description,
          requires_document,
          max_days,
          is_active
        }
      });

      res.json({
        success: true,
        data: leaveType,
        message: 'Leave type updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating leave type:', error);
      throw new CustomError('Failed to update leave type', 500);
    }
  }

  // DELETE /api/leave/types/:id - Delete leave type
  static async deleteLeaveType(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if leave type is being used in any leave applications
      const existingApplications = await prisma.leaveApplication.findFirst({
        where: { leave_type_id: id }
      });

      if (existingApplications) {
        throw new CustomError('Cannot delete leave type that is being used in leave applications', 400);
      }

      // Check if leave type is being used in any leave balances
      const existingBalances = await prisma.leaveBalance.findFirst({
        where: { leave_type_id: id }
      });

      if (existingBalances) {
        throw new CustomError('Cannot delete leave type that has associated leave balances', 400);
      }

      const leaveType = await prisma.leaveType.delete({
        where: { id }
      });

      res.json({
        success: true,
        data: leaveType,
        message: 'Leave type deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting leave type:', error);
      if (error.code === 'P2003') {
        throw new CustomError('Cannot delete leave type that is referenced by other records', 400);
      }
      if (error.message.includes('Cannot delete leave type')) {
        throw new CustomError(error.message, 400);
      }
      throw new CustomError('Failed to delete leave type', 500);
    }
  }

  // ==================== LEAVE BALANCE ====================

  // GET /api/leave/balance/my - Get logged-in user's leave balance
  static async getMyLeaveBalance(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new CustomError('Unauthorized', 401);
      }

      // Find personnel record for this user
      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId }
      });

      if (!personnel) {
        throw new CustomError('Personnel record not found', 404);
      }

      const currentYear = new Date().getFullYear().toString();
      
      const balances = await prisma.leaveBalance.findMany({
        where: { 
          personnel_id: personnel.id,
          year: currentYear
        },
        include: {
          leave_type: true
        },
        orderBy: {
          leave_type: {
            leave_type_name: 'asc'
          }
        }
      });

      res.json({
        success: true,
        data: balances,
        message: 'Leave balance fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching leave balance:', error);
      throw new CustomError('Failed to fetch leave balance', 500);
    }
  }

  // GET /api/leave/balance/:personnel_id - Get personnel's leave balance
  static async getPersonnelLeaveBalance(req: Request, res: Response) {
    try {
      const { personnel_id } = req.params;
      const { year = new Date().getFullYear().toString() } = req.query;

      const balances = await prisma.leaveBalance.findMany({
        where: { 
          personnel_id,
          year: year as string
        },
        include: {
          leave_type: true,
          personnel: {
            select: {
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: {
          leave_type: {
            leave_type_name: 'asc'
          }
        }
      });

      res.json({
        success: true,
        data: balances,
        message: 'Personnel leave balance fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching personnel leave balance:', error);
      throw new CustomError('Failed to fetch personnel leave balance', 500);
    }
  }

  // POST /api/leave/balance/initialize - Initialize leave balances
  static async initializeLeaveBalance(req: Request, res: Response) {
    try {
      const { personnel_id, year, leave_type_id, total_credits } = req.body;

      if (!personnel_id || !year || !leave_type_id || total_credits === undefined) {
        throw new CustomError('Missing required fields', 400);
      }

      const balance = await prisma.leaveBalance.upsert({
        where: {
          personnel_id_leave_type_id_year: {
            personnel_id,
            leave_type_id,
            year
          }
        },
        update: {
          total_credits,
          last_updated: new Date()
        },
        create: {
          personnel_id,
          leave_type_id,
          year,
          total_credits,
          used_credits: 0,
          earned_credits: 0
        },
        include: {
          leave_type: true,
          personnel: {
            select: {
              first_name: true,
              last_name: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: balance,
        message: 'Leave balance initialized successfully'
      });
    } catch (error: any) {
      console.error('Error initializing leave balance:', error);
      throw new CustomError('Failed to initialize leave balance', 500);
    }
  }

  // ==================== LEAVE MONETIZATION ====================

  // GET /api/leave/monetization - Get leave monetization requests
  static async getLeaveMonetization(req: Request, res: Response) {
    try {
      const { status, personnel_id, page = 1, limit = 10 } = req.query;

      const where: any = {};
      if (status) where.status = status;
      if (personnel_id) where.personnel_id = personnel_id;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [requests, total] = await Promise.all([
        prisma.leaveMonetization.findMany({
          where,
          include: {
            personnel: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            },
            leave_type: true
          },
          skip,
          take,
          orderBy: {
            request_date: 'desc'
          }
        }),
        prisma.leaveMonetization.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        },
        message: 'Leave monetization requests fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching leave monetization:', error);
      throw new CustomError('Failed to fetch leave monetization requests', 500);
    }
  }

  // POST /api/leave/monetization - Create leave monetization request
  static async createLeaveMonetization(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new CustomError('Unauthorized', 401);
      }

      // Find personnel record for this user
      const personnel = await prisma.personnel.findFirst({
        where: { user_id: userId }
      });

      if (!personnel) {
        throw new CustomError('Personnel record not found', 404);
      }

      const { leave_type_id, days_to_monetize } = req.body;

      if (!leave_type_id || !days_to_monetize) {
        throw new CustomError('Missing required fields', 400);
      }

      const request = await prisma.leaveMonetization.create({
        data: {
          personnel_id: personnel.id,
          leave_type_id,
          days_to_monetize,
          status: 'Pending'
        },
        include: {
          leave_type: true
        }
      });

      res.status(201).json({
        success: true,
        data: request,
        message: 'Leave monetization request created successfully'
      });
    } catch (error: any) {
      console.error('Error creating leave monetization:', error);
      throw new CustomError('Failed to create leave monetization request', 500);
    }
  }

  // PUT /api/leave/monetization/:id/approve - Approve leave monetization
  static async approveLeaveMonetization(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('Unauthorized', 401);
      }

      const request = await prisma.leaveMonetization.update({
        where: { id },
        data: {
          status: 'Approved',
          amount,
          approved_by: userId,
          approval_date: new Date()
        },
        include: {
          leave_type: true,
          personnel: {
            select: {
              first_name: true,
              last_name: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: request,
        message: 'Leave monetization approved successfully'
      });
    } catch (error: any) {
      console.error('Error approving leave monetization:', error);
      throw new CustomError('Failed to approve leave monetization', 500);
    }
  }

  // ==================== LEAVE REPORTS ====================

  // GET /api/leave/reports/summary - Get leave summary report
  static async getLeaveSummaryReport(req: Request, res: Response) {
    try {
      const { 
        start_date, 
        end_date, 
        department_id, 
        leave_type_id 
      } = req.query;

      const where: any = {};
      
      if (start_date && end_date) {
        where.start_date = {
          gte: new Date(start_date as string),
          lte: new Date(end_date as string)
        };
      }

      if (leave_type_id) {
        where.leave_type_id = leave_type_id;
      }

      if (department_id) {
        where.personnel = {
          department_id: department_id
        };
      }

      const [
        totalApplications,
        approvedApplications,
        pendingApplications,
        rejectedApplications,
        byLeaveType,
        byDepartment
      ] = await Promise.all([
        prisma.leaveApplication.count({ where }),
        prisma.leaveApplication.count({ where: { ...where, status: 'Approved' } }),
        prisma.leaveApplication.count({ where: { ...where, status: 'Pending' } }),
        prisma.leaveApplication.count({ where: { ...where, status: 'Rejected' } }),
        prisma.leaveApplication.groupBy({
          by: ['leave_type_id'],
          where,
          _count: { id: true },
          _sum: { total_days: true }
        }),
        prisma.leaveApplication.groupBy({
          by: ['personnel_id'],
          where,
          _count: { id: true },
          _sum: { total_days: true }
        })
      ]);

      const summary = {
        total_applications: totalApplications,
        approved: approvedApplications,
        pending: pendingApplications,
        rejected: rejectedApplications,
        by_leave_type: byLeaveType,
        by_department: byDepartment
      };

      res.json({
        success: true,
        data: summary,
        message: 'Leave summary report generated successfully'
      });
    } catch (error: any) {
      console.error('Error generating leave summary report:', error);
      throw new CustomError('Failed to generate leave summary report', 500);
    }
  }

  // GET /api/leave/reports/balance - Get leave balance report
  static async getLeaveBalanceReport(req: Request, res: Response) {
    try {
      const { department_id, year = new Date().getFullYear().toString() } = req.query;

      const where: any = { year: year as string };
      
      if (department_id) {
        where.personnel = {
          department_id: department_id
        };
      }

      const balances = await prisma.leaveBalance.findMany({
        where,
        include: {
          personnel: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              department: {
                select: {
                  id: true,
                  department_name: true
                }
              }
            }
          },
          leave_type: true
        },
        orderBy: [
          {
            personnel: {
              department: {
                department_name: 'asc'
              }
            }
          },
          {
            personnel: {
              last_name: 'asc'
            }
          }
        ]
      });

      res.json({
        success: true,
        data: balances,
        message: 'Leave balance report generated successfully'
      });
    } catch (error: any) {
      console.error('Error generating leave balance report:', error);
      throw new CustomError('Failed to generate leave balance report', 500);
    }
  }

  // ==================== LEAVE CREDIT ADJUSTMENTS ====================

  // POST /api/leave/adjustments - Create leave credit adjustment
  static async createLeaveAdjustment(req: AuthenticatedRequest, res: Response) {
    try {
      const { personnel_id, leave_type_id, year, adjustment_type, adjustment_amount, reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new CustomError('Unauthorized', 401);
      }

      // Validate required fields
      if (!personnel_id || !leave_type_id || !year || !adjustment_type || !adjustment_amount || !reason) {
        throw new CustomError('Missing required fields', 400);
      }

      // Validate adjustment type
      if (!['increase', 'decrease'].includes(adjustment_type)) {
        throw new CustomError('Invalid adjustment type. Must be "increase" or "decrease"', 400);
      }

      // Validate adjustment amount
      if (adjustment_amount <= 0) {
        throw new CustomError('Adjustment amount must be greater than 0', 400);
      }

      // Get current leave balance
      const currentBalance = await prisma.leaveBalance.findUnique({
        where: {
          personnel_id_leave_type_id_year: {
            personnel_id,
            leave_type_id,
            year
          }
        },
        include: {
          personnel: {
            select: {
              first_name: true,
              last_name: true
            }
          },
          leave_type: {
            select: {
              leave_type_name: true
            }
          }
        }
      });

      if (!currentBalance) {
        throw new CustomError('Leave balance not found for the specified personnel, leave type, and year', 404);
      }

      const previousBalance = currentBalance.total_credits;
      let newBalance: number;

      if (adjustment_type === 'increase') {
        newBalance = previousBalance + adjustment_amount;
      } else {
        newBalance = previousBalance - adjustment_amount;
        if (newBalance < 0) {
          throw new CustomError('Adjustment would result in negative balance', 400);
        }
      }

      // Create adjustment record and update balance in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create adjustment record
        const adjustment = await tx.leaveAdjustment.create({
          data: {
            personnel_id,
            leave_type_id,
            year,
            adjustment_type,
            adjustment_amount,
            reason,
            previous_balance: previousBalance,
            new_balance: newBalance,
            created_by: userId
          },
          include: {
            personnel: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            leave_type: {
              select: {
                leave_type_name: true
              }
            },
            created_by_user: {
              select: {
                username: true
              }
            }
          }
        });

        // Update leave balance
        await tx.leaveBalance.update({
          where: {
            personnel_id_leave_type_id_year: {
              personnel_id,
              leave_type_id,
              year
            }
          },
          data: {
            total_credits: newBalance,
            last_updated: new Date()
          }
        });

        return adjustment;
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Leave credit adjustment created successfully'
      });
    } catch (error: any) {
      console.error('Error creating leave adjustment:', error);
      
      if (error instanceof CustomError) {
        throw error;
      }
      
      throw new CustomError('Failed to create leave adjustment', 500);
    }
  }

  // GET /api/leave/adjustments - Get leave credit adjustments
  static async getLeaveAdjustments(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        personnel_id, 
        leave_type_id, 
        year, 
        adjustment_type,
        page = 1, 
        limit = 10 
      } = req.query;

      const where: any = {};
      
      if (personnel_id) where.personnel_id = personnel_id;
      if (leave_type_id) where.leave_type_id = leave_type_id;
      if (year) where.year = year;
      if (adjustment_type) where.adjustment_type = adjustment_type;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [adjustments, total] = await Promise.all([
        prisma.leaveAdjustment.findMany({
          where,
          include: {
            personnel: {
              select: {
                first_name: true,
                last_name: true,
                department: {
                  select: {
                    department_name: true
                  }
                }
              }
            },
            leave_type: {
              select: {
                leave_type_name: true
              }
            },
            created_by_user: {
              select: {
                username: true
              }
            }
          },
          skip,
          take,
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.leaveAdjustment.count({ where })
      ]);

      res.json({
        success: true,
        data: adjustments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        message: 'Leave adjustments fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching leave adjustments:', error);
      throw new CustomError('Failed to fetch leave adjustments', 500);
    }
  }

  // GET /api/leave/adjustments/:personnel_id - Get adjustments for specific personnel
  static async getPersonnelAdjustments(req: AuthenticatedRequest, res: Response) {
    try {
      const { personnel_id } = req.params;
      const { year = new Date().getFullYear().toString(), page = 1, limit = 10 } = req.query;

      const where: any = { personnel_id };
      if (year) where.year = year;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [adjustments, total] = await Promise.all([
        prisma.leaveAdjustment.findMany({
          where,
          include: {
            leave_type: {
              select: {
                leave_type_name: true
              }
            },
            created_by_user: {
              select: {
                username: true
              }
            }
          },
          skip,
          take,
          orderBy: {
            created_at: 'desc'
          }
        }),
        prisma.leaveAdjustment.count({ where })
      ]);

      res.json({
        success: true,
        data: adjustments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        message: 'Personnel adjustments fetched successfully'
      });
    } catch (error: any) {
      console.error('Error fetching personnel adjustments:', error);
      throw new CustomError('Failed to fetch personnel adjustments', 500);
    }
  }
} 