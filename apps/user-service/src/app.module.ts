import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Post,
  PostSchema,
  User,
  UserSchema,
  UserSettings,
  UserSettingsSchema,
} from '@ng-console-api/database';
import { KafkaProducerService } from '@ng-console-api/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

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
      { name: User.name, schema: UserSchema },
      { name: UserSettings.name, schema: UserSettingsSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, KafkaProducerService],
})
export class AppModule {}
