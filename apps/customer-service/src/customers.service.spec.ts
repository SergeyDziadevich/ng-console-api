import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer, CustomerLevel } from '@ng-console-api/database';
import { KafkaProducerService } from '@ng-console-api/common';
import { KAFKA_TOPICS } from '@ng-console-api/contracts';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockCustomerRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
  } = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockKafkaProducer: { emit: jest.Mock } = {
    emit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepo,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('create', () => {
    it('should create customer and emit audit log to Kafka', async () => {
      const mockCustomer = {
        id: 'cust-1',
        name: 'Enterprise Client',
        email: 'client@enterprise.com',
        level: CustomerLevel.STANDARD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepo.create.mockReturnValue(mockCustomer);
      mockCustomerRepo.save.mockResolvedValue(mockCustomer);

      const result = await service.create({
        name: 'Enterprise Client',
        email: 'client@enterprise.com',
      });

      expect(result.id).toBe('cust-1');
      expect(result.name).toBe('Enterprise Client');
      expect(mockKafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.AUDIT_LOGS,
        expect.objectContaining({
          action: 'CUSTOMER_CREATED',
          entityId: 'cust-1',
        }),
        'cust-1',
      );
    });
  });

  describe('findById', () => {
    it('should return customer DTO when found', async () => {
      const mockCustomer = {
        id: 'cust-1',
        name: 'Enterprise Client',
        email: 'client@enterprise.com',
        level: CustomerLevel.STANDARD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepo.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findById('cust-1');
      expect(result.id).toBe('cust-1');
      expect(result.email).toBe('client@enterprise.com');
    });
  });
});
