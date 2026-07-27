import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { UsersService } from '../users/users.service';

@Injectable()
export class IntegrationsService {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>(
        'GOOGLE_DRIVE_CLIENT_ID',
        'dummy_client_id',
      ),
      this.configService.get<string>(
        'GOOGLE_DRIVE_CLIENT_SECRET',
        'dummy_client_secret',
      ),
      this.configService.get<string>(
        'GOOGLE_DRIVE_REDIRECT_URI',
        'http://localhost:4200/settings',
      ),
    );
  }

  getGoogleDriveAuthUrl(): string {
    const scopes = ['https://www.googleapis.com/auth/drive.file'];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
  }

  async handleGoogleDriveCallback(code: string, userId: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      const settingsUpdate: Record<string, any> = {
        googleDriveSyncEnabled: true,
      };

      if (tokens.refresh_token) {
        settingsUpdate.googleDriveRefreshToken = tokens.refresh_token;
      }

      await this.usersService.updateUser(userId, {
        settings: settingsUpdate,
      });
    } catch (error) {
      console.error('Error in Google Drive callback:', error);
      throw new InternalServerErrorException(
        'Failed to authenticate with Google Drive',
      );
    }
  }

  async disconnectGoogleDrive(userId: string): Promise<void> {
    await this.usersService.updateUser(userId, {
      settings: {
        googleDriveRefreshToken: '',
        googleDriveSyncEnabled: false,
      },
    });
  }
}
