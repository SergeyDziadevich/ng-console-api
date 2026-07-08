import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { EpicTag } from './entities/epic-tag.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ProducerService } from '../kafka/producer.service';
import { AuditProducerService } from '../audit/audit-producer.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(EpicTag)
    private readonly epicTagRepository: Repository<EpicTag>,
    private readonly producerService: ProducerService,
    private readonly auditProducerService: AuditProducerService,
  ) {}

  async create(
    createTicketDto: CreateTicketDto,
    authorId?: string,
  ): Promise<Ticket> {
    const ticket = this.ticketsRepository.create(createTicketDto);
    const savedTicket = await this.ticketsRepository.save(ticket);

    // Send notification email asynchronously via Kafka
    this.producerService
      .produce({
        topic: 'email.notification',
        messages: [
          {
            value: JSON.stringify({
              // TODO: change to example@gmail.com
              to: 'developersiteweb@gmail.com',
              name: 'Developer',
              message: `A new ticket "${savedTicket.title || `Ticket #${savedTicket.id}`}" has been created.`,
            }),
          },
        ],
      })
      .catch((error) => {
        console.error(
          'Failed to produce ticket creation notification message:',
          error,
        );
      });

    this.auditProducerService
      .logAction(
        'TICKET_CREATED',
        'Ticket',
        savedTicket.id.toString(),
        authorId || 'SYSTEM', // System or current user
        { title: savedTicket.title },
      )
      .catch((e) => console.error(e));

    return savedTicket;
  }

  async findAllEpics(): Promise<EpicTag[]> {
    return this.epicTagRepository.find();
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      relations: { comments: true },
    });
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: { comments: true },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket #${id} not found`);
    }
    return ticket;
  }

  async update(
    id: number,
    updateTicketDto: UpdateTicketDto,
    authorId?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    this.ticketsRepository.merge(ticket, updateTicketDto);
    const saved = await this.ticketsRepository.save(ticket);

    this.auditProducerService
      .logAction(
        'TICKET_UPDATED',
        'Ticket',
        id.toString(),
        authorId || 'SYSTEM',
        { updatedFields: Object.keys(updateTicketDto) },
      )
      .catch((e) => console.error(e));

    return saved;
  }

  async remove(id: number, authorId?: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketsRepository.remove(ticket);

    this.auditProducerService
      .logAction(
        'TICKET_DELETED',
        'Ticket',
        id.toString(),
        authorId || 'SYSTEM',
        {},
      )
      .catch((e) => console.error(e));
  }

  async addComment(
    ticketId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const ticket = await this.findOne(ticketId);
    const comment = this.commentsRepository.create({
      ...createCommentDto,
      ticket,
    });
    return this.commentsRepository.save(comment);
  }

  async bulkUpdateStatus(
    ids: number[],
    status: TicketStatus,
    authorId?: string,
  ): Promise<void> {
    await this.ticketsRepository.update({ id: In(ids) }, { status });
    this.auditProducerService
      .logAction(
        'TICKET_BULK_UPDATED',
        'Ticket',
        ids.join(','),
        authorId || 'SYSTEM',
        { status },
      )
      .catch((e) => console.error('Failed to log bulk update action:', e));
  }
}
