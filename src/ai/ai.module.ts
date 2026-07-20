import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { TicketsModule } from '../tickets/tickets.module';
import { AuditModule } from '../audit/audit.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Document, DocumentSchema } from '../schemas/document.schema';
import {
  DocumentChunk,
  DocumentChunkSchema,
} from '../schemas/document-chunk.schema';

@Module({
  imports: [
    UsersModule,
    PostsModule,
    TicketsModule,
    AuditModule,
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
      { name: DocumentChunk.name, schema: DocumentChunkSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
