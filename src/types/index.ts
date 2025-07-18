import { Request } from 'express';
import { User, Personnel } from '@prisma/client';

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: User & { 
    personnel?: Personnel;
    role?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination types
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Filter types
export interface FilterQuery {
  search?: string;
  status?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Module configuration types
export interface ModuleConfig {
  name: string;
  isEnabled: boolean;
  permissions: string[];
  routes: string[];
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  lastActivity?: number;
  tokenType?: string;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Audit log types
export interface AuditLogData {
  actionType: string;
  tableAffected: string;
  recordId: string;
  actionDetails?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Notification types
export interface NotificationData {
  userId: string;
  notificationType: string;
  message: string;
  relatedId?: string;
  relatedTable?: string;
}

// Report types
export interface ReportConfig {
  name: string;
  description: string;
  parameters: ReportParameter[];
  permissions: string[];
}

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

// Export types
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

// Search types
export interface SearchOptions {
  query: string;
  fields: string[];
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} 