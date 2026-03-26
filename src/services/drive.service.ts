import { google } from 'googleapis';
import fs from 'fs';
import env from '../config/env.config';
import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

class DriveService {
  private createOAuthClient(accessToken: string, refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    return oauth2Client;
  }

  async createFolderForClient(userId: string, folderName: string, caEmail: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      throw new ApiError(400, 'User Google Drive not connected');
    }

    const auth = this.createOAuthClient(user.googleAccessToken, user.googleRefreshToken);
    const drive = google.drive({ version: 'v3', auth });

    try {
      // 1. Create the folder
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const response = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });
      const folderId = response.data.id!;

      // 2. Share the folder with the CA
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: caEmail
        }
      });

      return folderId;
    } catch (error) {
      console.error('Drive folder creation error:', error);
      throw error;
    }
  }

  async uploadFileToUserDrive(userId: string, filePath: string, fileName: string, mimeType: string, folderId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      throw new ApiError(400, 'User Google Drive not connected');
    }

    const auth = this.createOAuthClient(user.googleAccessToken, user.googleRefreshToken);
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    try {
      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });
      return file.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
}

export const driveService = new DriveService();
