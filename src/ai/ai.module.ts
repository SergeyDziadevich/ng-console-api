import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [UsersModule, PostsModule, TicketsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
