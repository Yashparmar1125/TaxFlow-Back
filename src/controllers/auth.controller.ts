import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import env from '../config/env.config';

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth', // Matches the specified path in PRD
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      
      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
      
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      
      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
      
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        throw new ApiError(401, 'Refresh token missing');
      }

      const result = await authService.refreshToken(token);
      
      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
      
      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (token) {
        await authService.logout(token);
      }
      
      res.clearCookie('refreshToken', { ...REFRESH_TOKEN_COOKIE_OPTIONS, maxAge: 0 });
      res.status(200).json({ success: true, data: { success: true } });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.requestPasswordReset(req.body);
      res.status(200).json({ success: true, message: 'Reset link sent if account exists' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      res.status(200).json({ success: true, data: { success: true } });
    } catch (error) {
      next(error);
    }
  },

  async verifyInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, email } = req.body;
      const result = await authService.verifyInvite(code, email);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async registerByInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerByInvite(req.body);
      
      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
      
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async firebaseSync(req: Request, res: Response, next: NextFunction) {
    try {
      const { fcmToken, role } = req.body;
      const firebaseUser = req.user as any;

      if (!firebaseUser) {
        throw new ApiError(401, 'Firebase user context missing');
      }

      const result = await authService.firebaseSync({
        firebaseUid: firebaseUser.sub,
        email: firebaseUser.email,
        fullName: firebaseUser.name,
        avatarUrl: firebaseUser.picture,
        fcmToken,
        role
      });

      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
