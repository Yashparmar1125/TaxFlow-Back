import admin from 'firebase-admin';
import env from '../config/env.config';
import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  if (serviceAccountPath) {
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    if (fs.existsSync(absolutePath)) {
      admin.initializeApp({
        credential: admin.credential.cert(absolutePath),
      });
    } else {
      console.warn(`⚠️ Firebase service account file not found at ${absolutePath}. Notifications will not work.`);
    }
  } else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_PATH not provided. Notifications will not work.');
  }
}

class FirebaseService {
  async sendNotification(token: string, title: string, body: string, data?: any) {
    const message = {
      notification: { title, body },
      token,
      data: data || {},
    };

    try {
      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      // In production, we might want to remove the token from the user if it's invalid
      throw error;
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: any) {
    const message = {
      notification: { title, body },
      topic,
      data: data || {},
    };

    try {
      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending topic notification:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
