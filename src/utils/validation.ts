import { ValidationError } from '@/types';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const createValidationError = (field: string, message: string, value?: any): ValidationError => {
  return {
    field,
    message,
    value
  };
};

export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(createValidationError(field, `${field} is required`));
    }
  });
  
  return errors;
};

export const validateFileUpload = (file: Express.Multer.File, allowedTypes: string[], maxSize: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!file) {
    errors.push(createValidationError('file', 'File is required'));
    return errors;
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(createValidationError('file', `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
  
  if (file.size > maxSize) {
    errors.push(createValidationError('file', `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`));
  }
  
  return errors;
}; 