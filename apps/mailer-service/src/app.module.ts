import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerConsumerController } from './mailer-consumer.controller';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  controllers: [MailerConsumerController],
  providers: [MailerService],
})
export class AppModule {}
