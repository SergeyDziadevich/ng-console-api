import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '@ng-console-api/database';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserModel: {
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    create: jest.Mock;
  } = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  } = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService: {
    get: jest.Mock;
  } = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'GOOGLE_CLIENT_ID') return 'google-client-id';
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signIn', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.signIn('unknown@example.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should issue access_token when credentials are valid and 2FA is disabled', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      const mockUser = {
        _id: 'user-id-123',
        email: 'john@example.com',
        username: 'john',
        password: hashedPassword,
        isTwoFactorEnabled: false,
        role: 'user',
        planId: 'pro',
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      mockJwtService.signAsync.mockResolvedValue('signed-jwt-token');

      const result = await service.signIn('john@example.com', 'CorrectPassword123!');

      expect(result.access_token).toBe('signed-jwt-token');
      expect(result.user?.id).toBe('user-id-123');
      expect(result.user?.email).toBe('john@example.com');
    });

    it('should return requires2fa and tempToken when 2FA is enabled', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      const mockUser = {
        _id: 'user-id-123',
        email: 'john@example.com',
        username: 'john',
        password: hashedPassword,
        isTwoFactorEnabled: true,
        twoFactorSecret: 'ABCDEF',
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      mockJwtService.signAsync.mockResolvedValue('temp-2fa-token');

      const result = await service.signIn('john@example.com', 'CorrectPassword123!');

      expect(result.requires2fa).toBe(true);
      expect(result.tempToken).toBe('temp-2fa-token');
    });
  });

  describe('validateToken', () => {
    it('should return valid true with payload on valid token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'user1@example.com',
        role: 'admin',
      });

      const result = await service.validateToken('valid-token');
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-1');
      expect(result.email).toBe('user1@example.com');
    });

    it('should return valid false on invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      const result = await service.validateToken('invalid-token');
      expect(result.valid).toBe(false);
    });
  });
});
