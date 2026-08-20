import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AuthGatewayController } from './controllers/auth.controller';
import { UsersGatewayController } from './controllers/users.controller';
import { TicketsGatewayController } from './controllers/tickets.controller';
import { DocumentsGatewayController } from './controllers/documents.controller';
import {
  AUTH_PATTERNS,
  USER_PATTERNS,
  TICKETS_PATTERNS,
  DOCUMENT_PATTERNS,
  MICROSERVICE_SERVICES,
} from '@ng-console-api/contracts';
import { JwtAuthGuard, UserContext } from '@ng-console-api/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('API Gateway Controllers', () => {
  let authController: AuthGatewayController;
  let usersController: UsersGatewayController;
  let ticketsController: TicketsGatewayController;
  let documentsController: DocumentsGatewayController;

  const mockClientProxy: { send: jest.Mock } = {
    send: jest.fn(),
  };

  const mockUser: UserContext = {
    id: 'user-uuid-1',
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        AuthGatewayController,
        UsersGatewayController,
        TicketsGatewayController,
        DocumentsGatewayController,
      ],
      providers: [
        {
          provide: MICROSERVICE_SERVICES.AUTH_SERVICE,
          useValue: mockClientProxy,
        },
        {
          provide: MICROSERVICE_SERVICES.USER_SERVICE,
          useValue: mockClientProxy,
        },
        {
          provide: MICROSERVICE_SERVICES.TICKET_SERVICE,
          useValue: mockClientProxy,
        },
        {
          provide: MICROSERVICE_SERVICES.DOCUMENT_SERVICE,
          useValue: mockClientProxy,
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockResolvedValue(mockUser),
            signAsync: jest.fn().mockResolvedValue('jwt-mock-token'),
          },
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    authController = module.get<AuthGatewayController>(AuthGatewayController);
    usersController = module.get<UsersGatewayController>(
      UsersGatewayController,
    );
    ticketsController = module.get<TicketsGatewayController>(
      TicketsGatewayController,
    );
    documentsController = module.get<DocumentsGatewayController>(
      DocumentsGatewayController,
    );
  });

  describe('AuthGatewayController', () => {
    it('should forward login request to Auth Microservice', async () => {
      const mockAuthResponse = { access_token: 'jwt-mock-token' };
      mockClientProxy.send.mockReturnValue(of(mockAuthResponse));

      const result = await authController.signIn({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(mockClientProxy.send).toHaveBeenCalledWith(AUTH_PATTERNS.SIGN_IN, {
        email: 'test@example.com',
        pass: 'Password123!',
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('should forward google login request', async () => {
      const mockResponse = { access_token: 'jwt-google-token' };
      mockClientProxy.send.mockReturnValue(of(mockResponse));

      const result = await authController.googleLogin({
        token: 'google-oauth-token',
      });

      expect(mockClientProxy.send).toHaveBeenCalledWith(
        AUTH_PATTERNS.GOOGLE_LOGIN,
        { token: 'google-oauth-token' },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('UsersGatewayController', () => {
    it('should forward find user by id request', async () => {
      const mockUserDto = {
        id: 'u1',
        email: 'u1@example.com',
        username: 'user1',
      };
      mockClientProxy.send.mockReturnValue(of(mockUserDto));

      const result = await usersController.findById('u1');

      expect(mockClientProxy.send).toHaveBeenCalledWith(
        USER_PATTERNS.FIND_BY_ID,
        { id: 'u1' },
      );
      expect(result).toEqual(mockUserDto);
    });

    it('should forward get profile of current user', async () => {
      const mockProfile = {
        id: 'user-uuid-1',
        email: 'admin@example.com',
        username: 'admin',
      };
      mockClientProxy.send.mockReturnValue(of(mockProfile));

      const result = await usersController.getProfile(mockUser);

      expect(mockClientProxy.send).toHaveBeenCalledWith(
        USER_PATTERNS.FIND_BY_ID,
        { id: 'user-uuid-1' },
      );
      expect(result).toEqual(mockProfile);
    });
  });

  describe('TicketsGatewayController', () => {
    it('should forward create ticket request', async () => {
      const mockTicket = {
        id: 'ticket-1',
        title: 'Fix issue',
        description: 'Detail',
        status: 'todo',
        priority: 'high',
        createdBy: mockUser.id,
        createdAt: '2026-08-20T00:00:00Z',
        updatedAt: '2026-08-20T00:00:00Z',
      };
      mockClientProxy.send.mockReturnValue(of(mockTicket));

      const result = await ticketsController.createTicket(mockUser, {
        title: 'Fix issue',
        description: 'Detail',
        status: 'todo',
        priority: 'high',
      });

      expect(mockClientProxy.send).toHaveBeenCalledWith(
        TICKETS_PATTERNS.CREATE,
        expect.objectContaining({
          title: 'Fix issue',
          createdBy: mockUser.id,
        }),
      );
      expect(result).toEqual(mockTicket);
    });
  });

  describe('DocumentsGatewayController', () => {
    it('should forward find all documents for owner', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          title: 'Invoice',
          filename: 'inv.pdf',
          mimetype: 'application/pdf',
          size: 2048,
          ownerId: mockUser.id,
          isSigned: false,
          createdAt: '2026-08-20T00:00:00Z',
          updatedAt: '2026-08-20T00:00:00Z',
        },
      ];
      mockClientProxy.send.mockReturnValue(of(mockDocs));

      const result = await documentsController.findAll(mockUser);

      expect(mockClientProxy.send).toHaveBeenCalledWith(
        DOCUMENT_PATTERNS.FIND_ALL,
        { ownerId: mockUser.id },
      );
      expect(result).toEqual(mockDocs);
    });
  });
});
