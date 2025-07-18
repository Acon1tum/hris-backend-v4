import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { CustomError } from '@/shared/middleware/error-handler';
import { validateEmail, validatePassword } from '@/utils/validation';
import { JWTPayload } from '@/types';

const prisma = new PrismaClient();

export class AuthController {
  static async register(req: Request, res: Response) {
    const { username, email, password, first_name, last_name, middle_name } = req.body;

    // Validate input
    if (!validateEmail(email)) {
      throw new CustomError('Invalid email format', 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new CustomError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      throw new CustomError('Username or email already exists', 409);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: passwordHash,
        role: 'Employee', // Default role, or set as needed
        personnel: {
          create: {
            first_name,
            last_name,
            middle_name,
            employment_type: 'Regular',
            salary: 0.0 // Default salary, can be updated later
          }
        }
      },
      include: {
        personnel: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      } as JWTPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          personnel: user.personnel
        },
        token
      }
    });
  }

  static async login(req: Request, res: Response) {
    const { username, password } = req.body;

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      },
      include: {
        personnel: true
      }
    });

    if (!user) {
      throw new CustomError('Invalid credentials', 401);
    }

    if (user.status !== 'Active') {
      throw new CustomError('Account is inactive', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new CustomError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      } as JWTPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '2h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        tokenType: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { updated_at: new Date() }
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          personnel: user.personnel,
          role: user.role
        },
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '2h',
        tokenType: 'Bearer'
      }
    });
  }

  static async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new CustomError('Refresh token required', 400);
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          personnel: true
        }
      });

      if (!user || user.status !== 'Active') {
        throw new CustomError('User not found or inactive', 401);
      }

      const newToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        } as JWTPayload,
        process.env.JWT_SECRET!,
        { expiresIn: '2h' }
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token: newToken }
      });
    } catch (error) {
      throw new CustomError('Invalid refresh token', 401);
    }
  }

  static async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new CustomError('User not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new CustomError('Current password is incorrect', 400);
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new CustomError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  }

  static async logout(req: Request, res: Response) {
    // In a stateless JWT setup, logout is handled client-side
    // You might want to implement a blacklist for tokens if needed
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
} 