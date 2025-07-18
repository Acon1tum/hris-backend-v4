import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/types';
import { CustomError } from '@/shared/middleware/error-handler';
import { parsePaginationQuery, createPaginationResponse } from '@/utils/pagination';
import { validateRequiredFields } from '@/utils/validation';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class PersonnelController {
  static async getAllPersonnel(req: AuthenticatedRequest, res: Response) {
    const pagination = parsePaginationQuery(req.query);
    const { search, department, status } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search as string, mode: 'insensitive' } },
        { last_name: { contains: search as string, mode: 'insensitive' } },
        { middle_name: { contains: search as string, mode: 'insensitive' } },
        { designation: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (department) {
      where.department_id = department;
    }

    if (status) {
      where.user = { status: status as string };
    }

    const [personnel, total] = await Promise.all([
      prisma.personnel.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              status: true,
              profile_picture: true
            }
          },
          department: {
            select: {
              id: true,
              department_name: true
            }
          }
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: {
          [pagination.sortBy]: pagination.sortOrder
        }
      }),
      prisma.personnel.count({ where })
    ]);

    const response = createPaginationResponse(
      personnel,
      total,
      pagination.page,
      pagination.limit
    );

    res.json({
      success: true,
      data: response.data,
      pagination: response.pagination
    });
  }

  static async getPersonnelById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    const personnel = await prisma.personnel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            status: true,
            created_at: true,
            updated_at: true
          }
        },
        department: {
          select: {
            id: true,
            department_name: true,
            description: true
          }
        },
        employment_history: true,
        personnel_schedules: {
          include: {
            work_schedule: true
          }
        },
        leave_balances: {
          include: {
            leave_type: true
          }
        },
        loan_records: true,
        performance_reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                username: true,
                personnel: {
                  select: {
                    first_name: true,
                    last_name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!personnel) {
      throw new CustomError('Personnel not found', 404);
    }

    res.json({
      success: true,
      data: personnel
    });
  }

  static async createPersonnel(req: AuthenticatedRequest, res: Response) {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      gender,
      civil_status,
      contact_number,
      address,
      department_id,
      designation,
      employment_type,
      date_hired,
      salary,
      gsis_number,
      pagibig_number,
      philhealth_number,
      sss_number,
      tin_number,
      profile_picture
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'username', 'email', 'password', 'first_name', 'last_name',
      'employment_type', 'date_hired', 'salary'
    ];
    const validationErrors = validateRequiredFields(req.body, requiredFields);
    if (validationErrors.length > 0) {
      throw new CustomError(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`, 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser) {
      throw new CustomError('Username or email already exists', 409);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user and personnel in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          username,
          email,
          password_hash: passwordHash,
          status: 'Active',
          ...(profile_picture ? { profile_picture } : {})
        }
      });

      // Create personnel
      const personnel = await tx.personnel.create({
        data: {
          user_id: user.id,
          first_name,
          last_name,
          middle_name,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          gender,
          civil_status,
          contact_number,
          address,
          department_id,
          designation,
          employment_type,
          date_hired: new Date(date_hired),
          salary: parseFloat(salary),
          gsis_number,
          pagibig_number,
          philhealth_number,
          sss_number,
          tin_number
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              status: true
            }
          },
          department: {
            select: {
              id: true,
              department_name: true
            }
          }
        }
      });

      return personnel;
    });

    res.status(201).json({
      success: true,
      message: 'Personnel created successfully',
      data: result
    });
  }

  static async updatePersonnel(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const updateData = req.body;

    // Check if personnel exists
    const existingPersonnel = await prisma.personnel.findUnique({
      where: { id }
    });

    if (!existingPersonnel) {
      throw new CustomError('Personnel not found', 404);
    }

    // Update personnel
    const updatedPersonnel = await prisma.personnel.update({
      where: { id },
      data: {
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        middle_name: updateData.middle_name,
        date_of_birth: updateData.date_of_birth ? new Date(updateData.date_of_birth) : null,
        gender: updateData.gender,
        civil_status: updateData.civil_status,
        contact_number: updateData.contact_number,
        address: updateData.address,
        department_id: updateData.department_id,
        designation: updateData.designation,
        employment_type: updateData.employment_type,
        date_hired: updateData.date_hired ? new Date(updateData.date_hired) : null,
        salary: updateData.salary ? parseFloat(updateData.salary) : undefined,
        gsis_number: updateData.gsis_number,
        pagibig_number: updateData.pagibig_number,
        philhealth_number: updateData.philhealth_number,
        sss_number: updateData.sss_number,
        tin_number: updateData.tin_number
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            status: true
          }
        },
        department: {
          select: {
            id: true,
            department_name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Personnel updated successfully',
      data: updatedPersonnel
    });
  }

  static async deletePersonnel(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;

    // Check if personnel exists
    const existingPersonnel = await prisma.personnel.findUnique({
      where: { id }
    });

    if (!existingPersonnel) {
      throw new CustomError('Personnel not found', 404);
    }

    // Delete personnel and user in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.personnel.delete({
        where: { id }
      });

      if (!existingPersonnel.user_id) {
        throw new CustomError('Personnel has no associated user_id', 400);
      }
      await tx.user.delete({
        where: { id: existingPersonnel.user_id }
      });
    });

    res.json({
      success: true,
      message: 'Personnel deleted successfully'
    });
  }

  static async getPersonnelStats(req: AuthenticatedRequest, res: Response) {
    const [
      totalPersonnel,
      activePersonnel,
      inactivePersonnel,
      departmentStats,
      employmentTypeStats
    ] = await Promise.all([
      prisma.personnel.count(),
      prisma.personnel.count({
        where: {
          user: { status: 'Active' }
        }
      }),
      prisma.personnel.count({
        where: {
          user: { status: 'Inactive' }
        }
      }),
      prisma.personnel.groupBy({
        by: ['department_id'],
        _count: {
          id: true
        },
        where: {
          user: { status: 'Active' }
        }
      }),
      prisma.personnel.groupBy({
        by: ['employment_type'],
        _count: {
          id: true
        },
        where: {
          user: { status: 'Active' }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalPersonnel,
        active: activePersonnel,
        inactive: inactivePersonnel,
        departmentStats,
        employmentTypeStats
      }
    });
  }

  // Employment History
  static async getEmploymentHistory(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const records = await prisma.employmentHistory.findMany({ where: { personnel_id: id } });
    res.json({ success: true, data: records });
  }

  static async addEmploymentHistory(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { organization, position, start_date, end_date, employment_type } = req.body;
    if (!organization || !position || !start_date || !employment_type) {
      throw new CustomError('Missing required fields', 400);
    }
    const record = await prisma.employmentHistory.create({
      data: {
        personnel_id: id,
        organization,
        position,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        employment_type
      }
    });
    res.status(201).json({ success: true, data: record });
  }

  // Membership Data (GSIS, Pag-Ibig, PhilHealth, etc. as part of Personnel)
  static async getMembershipData(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const personnel = await prisma.personnel.findUnique({
      where: { id },
      select: {
        gsis_number: true,
        pagibig_number: true,
        philhealth_number: true,
        sss_number: true,
        tin_number: true
      }
    });
    if (!personnel) throw new CustomError('Personnel not found', 404);
    res.json({ success: true, data: personnel });
  }

  static async updateMembershipData(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { gsis_number, pagibig_number, philhealth_number, sss_number, tin_number } = req.body;
    const personnel = await prisma.personnel.update({
      where: { id },
      data: { gsis_number, pagibig_number, philhealth_number, sss_number, tin_number }
    });
    res.json({ success: true, data: personnel });
  }

  // Merits & Violations
  static async getMeritsViolations(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const records = await prisma.meritViolation.findMany({ where: { personnel_id: id } });
    res.json({ success: true, data: records });
  }

  static async addMeritViolation(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { record_type, description, date_recorded, documented_by, document_path } = req.body;
    if (!record_type || !description || !date_recorded || !documented_by) {
      throw new CustomError('Missing required fields', 400);
    }
    const record = await prisma.meritViolation.create({
      data: {
        personnel_id: id,
        record_type,
        description,
        date_recorded: new Date(date_recorded),
        documented_by,
        document_path
      }
    });
    res.status(201).json({ success: true, data: record });
  }

  // Administrative Cases
  static async getAdministrativeCases(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const cases = await prisma.administrativeCase.findMany({ where: { personnel_id: id } });
    res.json({ success: true, data: cases });
  }

  static async addAdministrativeCase(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { case_title, case_description, case_status, date_filed, filed_by, document_path } = req.body;
    if (!case_title || !case_description || !date_filed || !filed_by) {
      throw new CustomError('Missing required fields', 400);
    }
    const adminCase = await prisma.administrativeCase.create({
      data: {
        personnel_id: id,
        case_title,
        case_description,
        case_status,
        date_filed: new Date(date_filed),
        filed_by,
        document_path
      }
    });
    res.status(201).json({ success: true, data: adminCase });
  }

  // Personnel Movement
  static async getPersonnelMovements(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const movements = await prisma.personnelMovement.findMany({ where: { personnel_id: id } });
    res.json({ success: true, data: movements });
  }

  static async addPersonnelMovement(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { movement_type, previous_department_id, new_department_id, previous_designation, new_designation, previous_salary, new_salary, previous_item_number, new_item_number, effective_date, issued_by, issued_date, remarks, document_path } = req.body;
    if (!movement_type || !effective_date || !issued_by || !issued_date) {
      throw new CustomError('Missing required fields', 400);
    }
    const movement = await prisma.personnelMovement.create({
      data: {
        personnel_id: id,
        movement_type,
        previous_department_id,
        new_department_id,
        previous_designation,
        new_designation,
        previous_salary,
        new_salary,
        previous_item_number,
        new_item_number,
        effective_date: new Date(effective_date),
        issued_by,
        issued_date: new Date(issued_date),
        remarks,
        document_path
      }
    });
    res.status(201).json({ success: true, data: movement });
  }

  // Get simplified employee list for admin dashboard
  static async getDashboardEmployees(req: AuthenticatedRequest, res: Response) {
    const pagination = parsePaginationQuery(req.query);
    const { search, department, status } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { first_name: { contains: search as string, mode: 'insensitive' } },
        { last_name: { contains: search as string, mode: 'insensitive' } },
        { middle_name: { contains: search as string, mode: 'insensitive' } },
        { designation: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (department) {
      where.department_id = department;
    }
    if (status) {
      where.user = { status: status as string };
    }

    const [personnel, total] = await Promise.all([
      prisma.personnel.findMany({
        where,
        include: {
          user: { select: { email: true, status: true } },
          department: { select: { department_name: true } },
          employeeSelfServiceProfile: { select: { profilePicture: true } },
          employeeDocuments: {
            where: {
              OR: [
                { category: 'profile' },
                { fileType: { contains: 'image', mode: 'insensitive' } }
              ]
            },
            select: { fileUrl: true },
            take: 1
          }
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder }
      }),
      prisma.personnel.count({ where })
    ]);

    // Map to frontend Employee interface
    const employees = personnel.map((p) => {
      let profileImage =
        p.employeeSelfServiceProfile?.profilePicture ||
        (p.employeeDocuments && p.employeeDocuments.length > 0 ? p.employeeDocuments[0].fileUrl : null) ||
        'https://randomuser.me/api/portraits/lego/1.jpg';
      return {
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.user?.email || '',
        department: p.department?.department_name || '',
        position: p.designation || '',
        hireDate: p.date_hired ? p.date_hired.toISOString().split('T')[0] : '',
        status: p.user?.status || '',
        profileImage
      };
    });

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total
      }
    });
  }

  /**
   * Upload multiple documents for a personnel (base64 stored directly in fileUrl)
   * POST /api/personnel/:id/documents
   * Body: { documents: [{ base64, title, description, fileType, category, isPrivate }] }
   */
  static async uploadDocuments(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { documents } = req.body;
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new CustomError('No documents provided', 400);
    }
    
    const createdDocs = [];
    for (const doc of documents) {
      const { base64, title, description, fileType, category, isPrivate } = doc;
      if (!base64 || !title || !fileType) {
        throw new CustomError('Missing required document fields', 400);
      }
      
      // Calculate file size from base64 data
      const matches = base64.match(/^data:(.+);base64,(.+)$/);
      const buffer = Buffer.from(matches ? matches[2] : base64, 'base64');
      const fileSize = buffer.length;
      
      // Save base64 data directly in fileUrl field
      const docRecord = await prisma.employeeDocument.create({
        data: {
          personnelId: id,
          title,
          description,
          fileUrl: base64, // Store the complete base64 data URL directly
          fileType,
          fileSize,
          category: category || 'general',
          isPrivate: isPrivate ?? false
        }
      });
      createdDocs.push(docRecord);
    }
    res.status(201).json({ success: true, data: createdDocs });
  }

  /**
   * Get all documents for a personnel
   * GET /api/personnel/:id/documents
   */
  static async getDocuments(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const docs = await prisma.employeeDocument.findMany({
      where: { personnelId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: docs });
  }
} 