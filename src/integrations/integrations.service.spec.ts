import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsService } from './integrations.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';

jest.mock('googleapis', () => {
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => {
          return {
            generateAuthUrl: jest.fn(),
            getToken: jest.fn(),
          };
        }),
      },
    },
  };
});

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let mockUsersService: {
    updateUser: jest.Mock;
  };
  let mockConfigService: {
    get: jest.Mock;
  };
  let mockOAuth2Client: {
    generateAuthUrl: jest.Mock;
    getToken: jest.Mock;
  };

  beforeEach(async () => {
    mockUsersService = {
      updateUser: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue: string) => {
        if (key === 'GOOGLE_DRIVE_CLIENT_ID') return 'test-client-id';
        if (key === 'GOOGLE_DRIVE_CLIENT_SECRET') return 'test-client-secret';
        if (key === 'GOOGLE_DRIVE_REDIRECT_URI') return 'http://test-redirect';
        return defaultValue;
      }),
    };

    // Reset the mock implementation of OAuth2 before each test to capture the instance
    const MockOAuth2 = google.auth.OAuth2 as jest.Mock;
    MockOAuth2.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    // The service constructor calls new google.auth.OAuth2(), so we can get the instance from the mock
    mockOAuth2Client = MockOAuth2.mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGoogleDriveAuthUrl', () => {
    it('should return an auth url with correct scopes', () => {
      const mockUrl = 'http://mock-auth-url';
      mockOAuth2Client.generateAuthUrl.mockReturnValue(mockUrl);

      const result = service.getGoogleDriveAuthUrl();

      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/drive.file'],
      });
      expect(result).toBe(mockUrl);
    });
  });

  describe('handleGoogleDriveCallback', () => {
    const mockUserId = 'user-123';
    const mockCode = 'auth-code-123';

    it('should update user with refresh token if provided', async () => {
      mockOAuth2Client.getToken.mockResolvedValue({
        tokens: { refresh_token: 'mock-refresh-token' },
      });

      await service.handleGoogleDriveCallback(mockCode, mockUserId);

      expect(mockOAuth2Client.getToken).toHaveBeenCalledWith(mockCode);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(mockUserId, {
        settings: {
          googleDriveSyncEnabled: true,
          googleDriveRefreshToken: 'mock-refresh-token',
        },
      });
    });

    it('should update user without refresh token if not provided', async () => {
      mockOAuth2Client.getToken.mockResolvedValue({
        tokens: { access_token: 'mock-access-token' }, // No refresh_token
      });

      await service.handleGoogleDriveCallback(mockCode, mockUserId);

      expect(mockOAuth2Client.getToken).toHaveBeenCalledWith(mockCode);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(mockUserId, {
        settings: {
          googleDriveSyncEnabled: true,
        },
      });
    });

    it('should throw InternalServerErrorException if getToken fails', async () => {
      mockOAuth2Client.getToken.mockRejectedValue(new Error('Auth failed'));

      await expect(
        service.handleGoogleDriveCallback(mockCode, mockUserId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('disconnectGoogleDrive', () => {
    it('should clear refresh token and disable sync', async () => {
      const mockUserId = 'user-123';

      await service.disconnectGoogleDrive(mockUserId);

      expect(mockUsersService.updateUser).toHaveBeenCalledWith(mockUserId, {
        settings: {
          googleDriveRefreshToken: '',
          googleDriveSyncEnabled: false,
        },
      });
    });
  });
});
