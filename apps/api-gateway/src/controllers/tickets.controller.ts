import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  MICROSERVICE_SERVICES,
  TICKETS_PATTERNS,
  TicketDto,
  CommentDto,
  EpicTagDto,
  CreateTicketCommand,
  UpdateTicketCommand,
  AddCommentCommand,
  BulkUpdateTicketsCommand,
} from '@ng-console-api/contracts';
import { CurrentUser, JwtAuthGuard, UserContext } from '@ng-console-api/common';
import {
  AddCommentDto,
  BulkUpdateTicketsDto,
  CreateTicketDto,
  UpdateTicketDto,
} from '../dto/ticket.dto';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.TICKET_SERVICE)
    private readonly ticketClient: ClientProxy,
  ) {}

  @Post()
  async createTicket(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateTicketDto,
  ): Promise<TicketDto> {
    const payload: CreateTicketCommand = {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      assignedTo: dto.assignedTo,
      epicTagId: dto.epicTagId,
      createdBy: user.id,
    };
    return firstValueFrom(
      this.ticketClient.send<TicketDto, CreateTicketCommand>(
        TICKETS_PATTERNS.CREATE,
        payload,
      ),
    );
  }

  @Get()
  async findAll(): Promise<TicketDto[]> {
    return firstValueFrom(
      this.ticketClient.send<TicketDto[], Record<string, never>>(
        TICKETS_PATTERNS.FIND_ALL,
        {},
      ),
    );
  }

  @Get('epics')
  async findEpics(): Promise<EpicTagDto[]> {
    return firstValueFrom(
      this.ticketClient.send<EpicTagDto[], Record<string, never>>(
        TICKETS_PATTERNS.FIND_EPICS,
        {},
      ),
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<TicketDto> {
    return firstValueFrom(
      this.ticketClient.send<TicketDto, { id: string }>(
        TICKETS_PATTERNS.FIND_BY_ID,
        { id },
      ),
    );
  }

  @Put(':id')
  async updateTicket(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
    @Body() dto: UpdateTicketDto,
  ): Promise<TicketDto> {
    const payload: UpdateTicketCommand = {
      id,
      data: dto,
      updatedBy: user.id,
    };
    return firstValueFrom(
      this.ticketClient.send<TicketDto, UpdateTicketCommand>(
        TICKETS_PATTERNS.UPDATE,
        payload,
      ),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(@Param('id') id: string): Promise<void> {
    await firstValueFrom(
      this.ticketClient.send<void, { id: string }>(
        TICKETS_PATTERNS.DELETE,
        { id },
      ),
    );
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @CurrentUser() user: UserContext,
    @Body() dto: AddCommentDto,
  ): Promise<CommentDto> {
    const payload: AddCommentCommand = {
      ticketId: id,
      authorId: user.id,
      content: dto.content,
    };
    return firstValueFrom(
      this.ticketClient.send<CommentDto, AddCommentCommand>(
        TICKETS_PATTERNS.ADD_COMMENT,
        payload,
      ),
    );
  }

  @Patch('bulk-update')
  async bulkUpdate(
    @CurrentUser() user: UserContext,
    @Body() dto: BulkUpdateTicketsDto,
  ): Promise<{ updatedCount: number }> {
    const payload: BulkUpdateTicketsCommand = {
      ticketIds: dto.ticketIds,
      status: dto.status,
      updatedBy: user.id,
    };
    return firstValueFrom(
      this.ticketClient.send<{ updatedCount: number }, BulkUpdateTicketsCommand>(
        TICKETS_PATTERNS.BULK_UPDATE,
        payload,
      ),
    );
  }
}
