import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import env from './env.config';
import { logger } from '../utils/logger';

const initializeFirebase = () => {
    try {
        let serviceAccount: admin.ServiceAccount;

        // 1. Try inline JSON from environment variable (for production/CI)
        if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount;
            logger.info('✅ Firebase: Using service account from environment variable');
        }
        // 2. Fall back to file path (for local development)
        else if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const serviceAccountPath = path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH);
            if (!fs.existsSync(serviceAccountPath)) {
                logger.error(`❌ Firebase service account file not found at: ${serviceAccountPath}`);
                return null;
            }
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8')) as admin.ServiceAccount;
            logger.info('✅ Firebase: Using service account from file');
        } else {
            logger.error('❌ Firebase: Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH is set');
            return null;
        }

        // Only initialize if not already initialized
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: env.FIREBASE_DATABASE_URL
            });
        }

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
