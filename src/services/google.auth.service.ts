import { google } from 'googleapis';
import prisma from '../config/prisma';
import env from '../config/env.config';
import { ApiError } from '../utils/ApiError';

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

export class GoogleAuthService {
  static getAuthUrl(userId: string) {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId
    });
  }

  static async handleCallback(code: string, userId: string) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email;
    const googleId = userInfo.data.id;

    if (!googleId || !googleEmail) {
      throw new ApiError(500, 'Failed to get user info from Google');
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        googleEmail,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
      }
    });
  }
}
