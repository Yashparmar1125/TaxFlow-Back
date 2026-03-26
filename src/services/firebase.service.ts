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
        databaseURL: env.FIREBASE_DATABASE_URL
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

  async syncMessage(threadId: string, message: any) {
    if (!admin.apps.length || !env.FIREBASE_DATABASE_URL) {
      console.warn('⚠️ Firebase RTDB not initialized. Skipping sync.');
      return;
    }

    try {
      const db = admin.database();
      const ref = db.ref(`messages/${threadId}/${message.id}`);
      await ref.set({
        content: message.content,
        senderId: message.senderId,
        senderRole: message.senderRole,
        createdAt: message.createdAt.toISOString(),
      });
      
      // Also update thread metadata in RTDB
      const threadRef = db.ref(`threads/${threadId}`);
      await threadRef.update({
        lastMessageAt: message.createdAt.toISOString(),
        lastMessagePreview: message.content.substring(0, 80),
      });
    } catch (error) {
      console.error('Error syncing message to Firebase RTDB:', error);
    }
  }
}

export const firebaseService = new FirebaseService();
