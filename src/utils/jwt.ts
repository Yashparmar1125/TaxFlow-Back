import jwt from 'jsonwebtoken';
import env from '../config/env.config';

export interface TokenPayload {
  sub: string;
  type: string;
  user_type?: string;
}

export const generateToken = (userId: string, type: 'access' | 'refresh'): string => {
  const expiresIn = type === 'access' ? '15m' : '30d';
  const payload: TokenPayload = {
    sub: userId,
    type,
    // Add roles or user_type if needed for middleware RBAC
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string, requiredType: 'access' | 'refresh'): TokenPayload | null => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (payload.type !== requiredType) {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch (error) {
    return null;
  }
};
