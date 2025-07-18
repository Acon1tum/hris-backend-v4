import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomError } from '@/shared/middleware/error-handler';

const prisma = new PrismaClient();

export class DepartmentsController {
  // Get all departments
  static async getAllDepartments(req: Request, res: Response) {
    try {
      const departments = await prisma.department.findMany({
        select: {
          id: true,
          department_name: true,
          description: true,
          department_head: true,
          created_at: true
        },
        orderBy: {
          department_name: 'asc'
        }
      });

      res.json({
        success: true,
        data: departments
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw new CustomError('Failed to fetch departments', 500);
    }
  }

  // Get department by ID
  static async getDepartmentById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          personnel: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              designation: true
            }
          }
        }
      });

      if (!department) {
        throw new CustomError('Department not found', 404);
      }

      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      console.error('Error fetching department:', error);
      throw new CustomError('Failed to fetch department', 500);
    }
  }

  // Create new department
  static async createDepartment(req: Request, res: Response) {
    const { department_name, description, department_head, parent_department_id } = req.body;

    if (!department_name) {
      throw new CustomError('Department name is required', 400);
    }

    try {
      const department = await prisma.department.create({
        data: {
          department_name,
          description,
          department_head,
          parent_department_id
        }
      });

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department
      });
    } catch (error) {
      console.error('Error creating department:', error);
      throw new CustomError('Failed to create department', 500);
    }
  }

  // Update department
  static async updateDepartment(req: Request, res: Response) {
    const { id } = req.params;
    const { department_name, description, department_head, parent_department_id } = req.body;

    try {
      const department = await prisma.department.update({
        where: { id },
        data: {
          department_name,
          description,
          department_head,
          parent_department_id
        }
      });

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: department
      });
    } catch (error) {
      console.error('Error updating department:', error);
      throw new CustomError('Failed to update department', 500);
    }
  }

  // Delete department
  static async deleteDepartment(req: Request, res: Response) {
    const { id } = req.params;

    try {
      await prisma.department.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      throw new CustomError('Failed to delete department', 500);
    }
  }
} 