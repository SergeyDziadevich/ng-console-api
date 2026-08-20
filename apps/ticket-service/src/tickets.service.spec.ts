import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { Comment, EpicTag, Ticket, TicketPriority, TicketStatus } from '@ng-console-api/database';
import { KafkaProducerService } from '@ng-console-api/common';
import { KAFKA_TOPICS } from '@ng-console-api/contracts';

describe('TicketsService', () => {
  let service: TicketsService;

  const mockTicketRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
    update: jest.Mock;
  } = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockCommentRepo: {
    create: jest.Mock;
    save: jest.Mock;
  } = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEpicTagRepo: {
    find: jest.Mock;
    findOneBy: jest.Mock;
  } = {
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockKafkaProducer: {
    emit: jest.Mock;
  } = {
    emit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepo,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepo,
        },
        {
          provide: getRepositoryToken(EpicTag),
          useValue: mockEpicTagRepo,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  describe('createTicket', () => {
    it('should create ticket, emit ticket.assigned and email.notification events to Kafka', async () => {
      const mockTicket = {
        id: 'ticket-uuid-1',
        title: 'Fix issue',
        description: 'Detail',
        status: TicketStatus.TODO,
        priority: TicketPriority.HIGH,
        assignedPersonId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTicketRepo.create.mockReturnValue(mockTicket);
      mockTicketRepo.save.mockResolvedValue(mockTicket);

      const result = await service.createTicket({
        title: 'Fix issue',
        description: 'Detail',
        priority: 'high',
        assignedTo: 'user-123',
        createdBy: 'user-creator',
      });

      expect(result.id).toBe('ticket-uuid-1');
      expect(result.title).toBe('Fix issue');
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.TICKET_ASSIGNED,
        expect.objectContaining({
          ticketId: 'ticket-uuid-1',
          userId: 'user-123',
        }),
        'ticket-uuid-1',
      );
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.EMAIL_NOTIFICATION,
        expect.objectContaining({
          subject: 'New Ticket: Fix issue',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return ticket if exists', async () => {
      const mockTicket = {
        id: 'ticket-uuid-1',
        title: 'Fix issue',
        description: 'Detail',
        status: TicketStatus.TODO,
        priority: TicketPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTicketRepo.findOne.mockResolvedValue(mockTicket);

      const result = await service.findById('ticket-uuid-1');
      expect(result.id).toBe('ticket-uuid-1');
      expect(result.title).toBe('Fix issue');
    });
  });
});
