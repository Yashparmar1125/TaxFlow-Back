import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token, 'access');

    if (!payload) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
