import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChatMessage,
  ChatRoom,
  ChatRoomMember,
} from '@ng-console-api/database';
import { KafkaProducerService } from '@ng-console-api/common';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(configService.get<number>('DATABASE_PORT', 5432)),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'tickets_db'),
        entities: [ChatRoom, ChatRoomMember, ChatMessage],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([ChatRoom, ChatRoomMember, ChatMessage]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, KafkaProducerService],
})
export class AppModule {}
