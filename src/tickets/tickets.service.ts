import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { Comment } from './entities/comment.entity';
import { EpicTag } from './entities/epic-tag.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ProducerService } from '../kafka/producer.service';

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
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketsRepository.create(createTicketDto);
    const savedTicket = await this.ticketsRepository.save(ticket);

    // Send notification email asynchronously via Kafka
    this.producerService
      .produce({
        topic: 'email.notification',
        messages: [
          {
            value: JSON.stringify({
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

  async update(id: number, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    this.ticketsRepository.merge(ticket, updateTicketDto);
    return this.ticketsRepository.save(ticket);
  }

  async remove(id: number): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketsRepository.remove(ticket);
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
}
