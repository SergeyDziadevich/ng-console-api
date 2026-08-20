import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  AddCommentCommand,
  BulkUpdateTicketsCommand,
  CommentDto,
  CreateTicketCommand,
  EpicTagDto,
  TicketDto,
  TICKETS_PATTERNS,
  UpdateTicketCommand,
} from '@ng-console-api/contracts';
import { TicketsService } from './tickets.service';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @MessagePattern(TICKETS_PATTERNS.CREATE)
  async createTicket(@Payload() data: CreateTicketCommand): Promise<TicketDto> {
    try {
      return await this.ticketsService.createTicket(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Create ticket failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(TICKETS_PATTERNS.FIND_ALL)
  async findAll(): Promise<TicketDto[]> {
    return this.ticketsService.findAll();
  }

  @MessagePattern(TICKETS_PATTERNS.FIND_BY_ID)
  async findById(@Payload() data: { id: string }): Promise<TicketDto> {
    try {
      return await this.ticketsService.findById(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ticket not found';
      throw new RpcException({ statusCode: 404, message });
    }
  }

  @MessagePattern(TICKETS_PATTERNS.UPDATE)
  async updateTicket(@Payload() data: UpdateTicketCommand): Promise<TicketDto> {
    try {
      return await this.ticketsService.updateTicket(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update ticket failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(TICKETS_PATTERNS.DELETE)
  async deleteTicket(@Payload() data: { id: string }): Promise<{ deleted: boolean }> {
    try {
      return await this.ticketsService.deleteTicket(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete ticket failed';
      throw new RpcException({ statusCode: 404, message });
    }
  }

  @MessagePattern(TICKETS_PATTERNS.ADD_COMMENT)
  async addComment(@Payload() data: AddCommentCommand): Promise<CommentDto> {
    try {
      return await this.ticketsService.addComment(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Add comment failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(TICKETS_PATTERNS.FIND_EPICS)
  async findEpics(): Promise<EpicTagDto[]> {
    return this.ticketsService.findEpics();
  }

  @MessagePattern(TICKETS_PATTERNS.BULK_UPDATE)
  async bulkUpdate(
    @Payload() data: BulkUpdateTicketsCommand,
  ): Promise<{ updatedCount: number }> {
    try {
      return await this.ticketsService.bulkUpdate(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bulk update failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }
}
