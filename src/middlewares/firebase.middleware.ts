import { Request, Response, NextFunction } from 'express';
import { fbAuth } from '../config/firebase.config';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'No Firebase ID token provided');
        }

        const idToken = authHeader.split(' ')[1];
        
        const decodedToken = await fbAuth.verifyIdToken(idToken);
        
        if (!decodedToken) {
            throw new ApiError(401, 'Invalid Firebase ID token');
        }

        req.user = {
            sub: decodedToken.uid,
            email: decodedToken.email as string,
            email_verified: decodedToken.email_verified || false,
            name: decodedToken.name || '',
            picture: decodedToken.picture || ''
        } as any;

        next();
    } catch (error) {
        logger.error('Firebase Token Verification Failed:', error);
        next(new ApiError(401, 'Unauthorized: Invalid Firebase token'));
    }
};
