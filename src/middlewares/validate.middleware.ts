import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!schema) {
        throw new ApiError(500, 'Validation schema is undefined for this route');
      }

      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (result.body) req.body = result.body;
      if (result.query) Object.assign(req.query, result.query);
      if (result.params) Object.assign(req.params, result.params);

      return next();
    } catch (error: any) {
      // Check for Zod-like error structure (issues or errors array)
      const issues = error.issues || error.errors;
      
      if (issues && Array.isArray(issues)) {
        const errorMessages = issues.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }));
        console.error('Validation Error Details:', {
          body: req.body,
          errors: errorMessages
        });
        return res.status(400).json({ success: false, errors: errorMessages });
      }

      console.error('Validation Middleware Failure:', error);
      return next(new ApiError(500, error.message || 'Internal Server Error'));
    }
  };
};
