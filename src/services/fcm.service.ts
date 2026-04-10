import { fbMessaging } from '../config/firebase.config';
import { logger } from '../utils/logger';

export class FcmService {
    static async sendToUser(fcmToken: string, title: string, body: string, data?: any) {
        try {
            if (!fcmToken) return;

            const message = {
                notification: { title, body },
                data: data || {},
                token: fcmToken
            };

            const response = await fbMessaging.send(message);
            logger.info('Successfully sent FCM message:', response);
            return response;
        } catch (error) {
            logger.error('Error sending FCM message:', error);
            // Don't throw, just log. Messaging is non-critical for core flow.
        }
    }

    static async sendToTopic(topic: string, title: string, body: string, data?: any) {
        try {
            const message = {
                notification: { title, body },
                data: data || {},
                topic: topic
            };

            const response = await fbMessaging.send(message);
            logger.info('Successfully sent FCM message to topic:', response);
            return response;
        } catch (error) {
            logger.error('Error sending FCM message to topic:', error);
        }
    }
}
