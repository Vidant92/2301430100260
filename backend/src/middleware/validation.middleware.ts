// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestWithId extends Request {
  requestId?: string;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export const validateRequest = (rules: ValidationRule[]) => {
  return (req: RequestWithId, res: Response, next: NextFunction) => {
    const errors: { [key: string]: string } = {};

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check if required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[rule.field] = `${rule.field} is required`;
        continue;
      }

      // Skip if not required and not provided
      if (!rule.required && !value) {
        continue;
      }

      // Check type
      if (rule.type && typeof value !== rule.type) {
        errors[rule.field] = `${rule.field} must be of type ${rule.type}`;
      }

      // Check length
      if (rule.minLength && value.length < rule.minLength) {
        errors[rule.field] = `${rule.field} must have at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors[rule.field] = `${rule.field} must have at most ${rule.maxLength} characters`;
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[rule.field] = `${rule.field} format is invalid`;
      }
    }

    if (Object.keys(errors).length > 0) {
      logger.warn(`Validation Failed`, {
        requestId: req.requestId,
        path: req.path,
        errors
      });

      return res.status(422).json({
        success: false,
        errors,
        message: 'Validation failed'
      });
    }

    next();
  };
};
