import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import env from './env.config';
import { logger } from '../utils/logger';

const initializeFirebase = () => {
    try {
        const serviceAccountPath = path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH!);
        
        if (!fs.existsSync(serviceAccountPath)) {
            logger.error(`❌ Firebase service account file not found at: ${serviceAccountPath}`);
            return null;
        }

        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: env.FIREBASE_DATABASE_URL
        });

        logger.info('✅ Firebase Admin SDK initialized successfully');
        return admin;
    } catch (error) {
        logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
        return null;
    }
};

export const fbAdmin = initializeFirebase();
export const fbAuth = admin.auth();
export const fbMessaging = admin.messaging();
