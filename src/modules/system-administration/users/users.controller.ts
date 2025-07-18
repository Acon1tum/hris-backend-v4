import { Request, Response } from 'express';
import { PrismaClient, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validatePassword } from '../../../utils/validation';
import { CustomError } from '../../../shared/middleware/error-handler';

const prisma = new PrismaClient();

export class UsersController {
  // List all users
  static async listUsers(req: Request, res: Response) {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
  }

  // Get user by ID
  static async getUser(req: Request, res: Response) {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id }
    });
    if (!user) throw new CustomError('User not found', 404);
    res.json({ success: true, data: user });
  }

  // Create user
  static async createUser(req: Request, res: Response) {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) throw new CustomError('Missing required fields', 400);
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) throw new CustomError(passwordValidation.errors.join(', '), 400);
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashed,
        status: Status.Active,
        role
      }
    });
    res.status(201).json({ success: true, data: user });
  }

  // Update user
  static async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const { username, email, status } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { username, email, status }
    });
    res.json({ success: true, data: user });
  }

  // Delete (or disable) user
  static async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    // Soft delete: set status to Inactive
    const user = await prisma.user.update({
      where: { id },
      data: { status: Status.Inactive },
    });
    res.json({ success: true, message: 'User disabled', data: user });
  }

  // Change password
  static async changePassword(req: Request, res: Response) {
    const { id } = req.params;
    const { newPassword } = req.body;
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) throw new CustomError(passwordValidation.errors.join(', '), 400);
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { password_hash: hashed }
    });
    res.json({ success: true, message: 'Password changed' });
  }

  // Assign role to user
  static async assignRoles(req: Request, res: Response) {
    const { id } = req.params;
    const { role } = req.body; // single role
    if (!role) throw new CustomError('Role is required', 400);
    await prisma.user.update({
      where: { id },
      data: { role }
    });
    res.json({ success: true, message: 'Role updated' });
  }
} 