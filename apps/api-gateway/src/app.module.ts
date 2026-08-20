import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  createMicroserviceClient,
  MICROSERVICE_SERVICES,
} from '@ng-console-api/common';
import {
  AuthGatewayController,
  UsersGatewayController,
  TicketsGatewayController,
  DocumentsGatewayController,
  PaymentsGatewayController,
  ChatGatewayController,
  NotificationsGatewayController,
  AuditGatewayController,
  AiGatewayController,
  CustomersGatewayController,
} from './controllers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'super-secret-jwt-key'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRATION', '24h') ||
            '24h') as `${number}h`,
        },
      }),
    }),
  ],
  controllers: [
    AuthGatewayController,
    UsersGatewayController,
    TicketsGatewayController,
    DocumentsGatewayController,
    PaymentsGatewayController,
    ChatGatewayController,
    NotificationsGatewayController,
    AuditGatewayController,
    AiGatewayController,
    CustomersGatewayController,
  ],
  providers: [
    {
      provide: MICROSERVICE_SERVICES.AUTH_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('AUTH_SERVICE', config, 4001),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.USER_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('USER_SERVICE', config, 4002),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.TICKET_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('TICKET_SERVICE', config, 4003),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.DOCUMENT_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('DOCUMENT_SERVICE', config, 4004),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.PAYMENT_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('PAYMENT_SERVICE', config, 4005),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.CHAT_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('CHAT_SERVICE', config, 4006),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.NOTIFICATION_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('NOTIFICATION_SERVICE', config, 4007),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.AUDIT_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('AUDIT_SERVICE', config, 4008),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.AI_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('AI_SERVICE', config, 4009),
      inject: [ConfigService],
    },
    {
      provide: MICROSERVICE_SERVICES.CUSTOMER_SERVICE,
      useFactory: (config: ConfigService) =>
        createMicroserviceClient('CUSTOMER_SERVICE', config, 4010),
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
