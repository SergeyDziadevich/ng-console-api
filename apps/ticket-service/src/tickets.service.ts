import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Comment,
  EpicTag,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '@ng-console-api/database';
import {
  AddCommentCommand,
  BulkUpdateTicketsCommand,
  CommentDto,
  CreateTicketCommand,
  EmailNotificationEvent,
  EpicTagDto,
  KAFKA_TOPICS,
  TicketAssignedEvent,
  TicketDto,
  UpdateTicketCommand,
} from '@ng-console-api/contracts';
import { KafkaProducerService } from '@ng-console-api/common';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(EpicTag)
    private readonly epicTagRepo: Repository<EpicTag>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createTicket(cmd: CreateTicketCommand): Promise<TicketDto> {
    const ticket = this.ticketRepo.create({
      title: cmd.title,
      description: cmd.description,
      status: (cmd.status as TicketStatus) || TicketStatus.TODO,
      priority: (cmd.priority as TicketPriority) || TicketPriority.MEDIUM,
      assignedPersonId: cmd.assignedTo,
    });

    if (cmd.epicTagId) {
      const epic = await this.epicTagRepo.findOneBy({
        id: Number(cmd.epicTagId),
      });
      if (epic) {
        ticket.epic = epic;
      }
    }

    const savedTicket = await this.ticketRepo.save(ticket);

    if (cmd.assignedTo) {
      const assignedEvent: TicketAssignedEvent = {
        ticketId: savedTicket.id,
        title: savedTicket.title,
        userId: cmd.assignedTo,
        assignedBy: cmd.createdBy,
        priority: savedTicket.priority,
        timestamp: new Date().toISOString(),
      };
      await this.kafkaProducer.emit(
        KAFKA_TOPICS.TICKET_ASSIGNED,
        assignedEvent,
        savedTicket.id,
      );
    }

    const emailEvent: EmailNotificationEvent = {
      to: 'team-notifications@example.com',
      name: 'Team',
      message: `New ticket created: ${savedTicket.title}`,
      subject: `New Ticket: ${savedTicket.title}`,
    };
    await this.kafkaProducer.emit(KAFKA_TOPICS.EMAIL_NOTIFICATION, emailEvent);

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'TICKET_CREATED',
        entityType: 'Ticket',
        entityId: savedTicket.id,
        authorId: cmd.createdBy,
        metadata: { title: savedTicket.title },
        createdAt: new Date().toISOString(),
      },
      savedTicket.id,
    );

    return this.mapToTicketDto(savedTicket, cmd.createdBy);
  }

  async findAll(): Promise<TicketDto[]> {
    const tickets = await this.ticketRepo.find({
      relations: { epic: true, comments: true },
      order: { createdAt: 'DESC' },
    });
    return tickets.map((t) => this.mapToTicketDto(t));
  }

  async findById(id: string): Promise<TicketDto> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: { epic: true, comments: true },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return this.mapToTicketDto(ticket);
  }

  async updateTicket(cmd: UpdateTicketCommand): Promise<TicketDto> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: cmd.id },
      relations: { epic: true, comments: true },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${cmd.id} not found`);
    }

    const oldAssignee = ticket.assignedPersonId;

    if (cmd.data.title !== undefined) ticket.title = cmd.data.title;
    if (cmd.data.description !== undefined)
      ticket.description = cmd.data.description;
    if (cmd.data.status !== undefined)
      ticket.status = cmd.data.status as TicketStatus;
    if (cmd.data.priority !== undefined)
      ticket.priority = cmd.data.priority as TicketPriority;
    if (cmd.data.assignedTo !== undefined)
      ticket.assignedPersonId = cmd.data.assignedTo;

    if (cmd.data.epicTagId !== undefined) {
      const epic = await this.epicTagRepo.findOneBy({
        id: Number(cmd.data.epicTagId),
      });
      if (epic) {
        ticket.epic = epic;
      }
    }

    const updated = await this.ticketRepo.save(ticket);

    if (cmd.data.assignedTo && cmd.data.assignedTo !== oldAssignee) {
      const assignedEvent: TicketAssignedEvent = {
        ticketId: updated.id,
        title: updated.title,
        userId: cmd.data.assignedTo,
        assignedBy: cmd.updatedBy,
        priority: updated.priority,
        timestamp: new Date().toISOString(),
      };
      await this.kafkaProducer.emit(
        KAFKA_TOPICS.TICKET_ASSIGNED,
        assignedEvent,
        updated.id,
      );
    }

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'TICKET_UPDATED',
        entityType: 'Ticket',
        entityId: updated.id,
        authorId: cmd.updatedBy || 'SYSTEM',
        metadata: { updatedFields: Object.keys(cmd.data) },
        createdAt: new Date().toISOString(),
      },
      updated.id,
    );

    return this.mapToTicketDto(updated, cmd.updatedBy);
  }

  async deleteTicket(
    id: string,
    authorId?: string,
  ): Promise<{ deleted: boolean }> {
    const ticket = await this.ticketRepo.findOneBy({ id });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    await this.ticketRepo.remove(ticket);

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'TICKET_DELETED',
        entityType: 'Ticket',
        entityId: id,
        authorId: authorId || 'SYSTEM',
        metadata: {},
        createdAt: new Date().toISOString(),
      },
      id,
    );

    return { deleted: true };
  }

  async addComment(cmd: AddCommentCommand): Promise<CommentDto> {
    const ticket = await this.ticketRepo.findOneBy({ id: cmd.ticketId });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${cmd.ticketId} not found`);
    }

    const comment = this.commentRepo.create({
      text: cmd.content,
      authorId: cmd.authorId,
      ticket,
    });

    const saved = await this.commentRepo.save(comment);

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'TICKET_COMMENT_ADDED',
        entityType: 'Comment',
        entityId: String(saved.id),
        authorId: cmd.authorId,
        metadata: { ticketId: cmd.ticketId },
        createdAt: new Date().toISOString(),
      },
      cmd.ticketId,
    );

    return {
      id: String(saved.id),
      ticketId: cmd.ticketId,
      authorId: saved.authorId,
      content: saved.text,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async findEpics(): Promise<EpicTagDto[]> {
    const epics = await this.epicTagRepo.find();
    return epics.map((e) => ({
      id: String(e.id),
      name: e.name,
    }));
  }

  async bulkUpdate(
    cmd: BulkUpdateTicketsCommand,
  ): Promise<{ updatedCount: number }> {
    const result = await this.ticketRepo.update(
      { id: In(cmd.ticketIds) },
      { status: cmd.status as TicketStatus },
    );

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'TICKETS_BULK_UPDATED',
        entityType: 'Ticket',
        entityId: 'BULK',
        authorId: cmd.updatedBy || 'SYSTEM',
        metadata: { count: result.affected ?? 0, status: cmd.status },
        createdAt: new Date().toISOString(),
      },
      'BULK',
    );

    return { updatedCount: result.affected ?? 0 };
  }

  private mapToTicketDto(ticket: Ticket, defaultCreatedBy?: string): TicketDto {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedPersonId,
      createdBy: defaultCreatedBy || 'system',
      epicTag: ticket.epic
        ? {
            id: String(ticket.epic.id),
            name: ticket.epic.name,
          }
        : undefined,
      comments: ticket.comments?.map((c) => ({
        id: String(c.id),
        ticketId: ticket.id,
        authorId: c.authorId,
        content: c.text,
        createdAt: c.createdAt.toISOString(),
      })),
      createdAt: ticket.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: ticket.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
