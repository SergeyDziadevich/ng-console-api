import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AuditLog,
  AuditLogSchema,
  SystemSettings,
  SystemSettingsSchema,
} from '@ng-console-api/database';
import { AuditController } from './audit.controller';
import { AuditConsumerController } from './audit-consumer.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/nest-angular',
      }),
    }),
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: SystemSettings.name, schema: SystemSettingsSchema },
    ]),
  ],
  controllers: [AuditController, AuditConsumerController],
  providers: [AuditService],
})
export class AppModule {}
