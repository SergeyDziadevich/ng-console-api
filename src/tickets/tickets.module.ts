import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { EpicTag } from './entities/epic-tag.entity';

import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Comment, EpicTag]), EmailModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
