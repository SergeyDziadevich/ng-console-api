import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerLevel } from '@ng-console-api/database';
import {
  CreateCustomerCommand,
  CustomerDto,
  KAFKA_TOPICS,
  UpdateCustomerCommand,
} from '@ng-console-api/contracts';
import { KafkaProducerService } from '@ng-console-api/common';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async create(cmd: CreateCustomerCommand): Promise<CustomerDto> {
    const customer = this.customerRepo.create({
      name: cmd.name,
      email: cmd.email,
      phone: cmd.phone,
      level: CustomerLevel.STANDARD,
      parentId: cmd.parentId,
    });

    const saved = await this.customerRepo.save(customer);

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'CUSTOMER_CREATED',
        entityType: 'Customer',
        entityId: saved.id,
        authorId: 'SYSTEM',
        metadata: { name: saved.name, email: saved.email },
        createdAt: new Date().toISOString(),
      },
      saved.id,
    );

    return this.mapToDto(saved);
  }

  async findAll(): Promise<CustomerDto[]> {
    const customers = await this.customerRepo.find({
      relations: ['subCustomers'],
      order: { createdAt: 'DESC' },
    });
    return customers.map((c) => this.mapToDto(c));
  }

  async findById(id: string): Promise<CustomerDto> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['subCustomers'],
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return this.mapToDto(customer);
  }

  async update(cmd: UpdateCustomerCommand): Promise<CustomerDto> {
    const customer = await this.customerRepo.findOneBy({ id: cmd.id });
    if (!customer) {
      throw new NotFoundException(`Customer ${cmd.id} not found`);
    }

    if (cmd.data.name !== undefined) customer.name = cmd.data.name;
    if (cmd.data.email !== undefined) customer.email = cmd.data.email;
    if (cmd.data.phone !== undefined) customer.phone = cmd.data.phone;
    if (cmd.data.parentId !== undefined) customer.parentId = cmd.data.parentId;

    const saved = await this.customerRepo.save(customer);

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'CUSTOMER_UPDATED',
        entityType: 'Customer',
        entityId: saved.id,
        authorId: 'SYSTEM',
        metadata: { updatedFields: Object.keys(cmd.data) },
        createdAt: new Date().toISOString(),
      },
      saved.id,
    );

    return this.mapToDto(saved);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const customer = await this.customerRepo.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    await this.customerRepo.remove(customer);

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'CUSTOMER_DELETED',
        entityType: 'Customer',
        entityId: id,
        authorId: 'SYSTEM',
        metadata: {},
        createdAt: new Date().toISOString(),
      },
      id,
    );

    return { deleted: true };
  }

  private mapToDto(customer: Customer): CustomerDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      parentId: customer.parentId,
      subCustomers: customer.subCustomers?.map((sub) => this.mapToDto(sub)),
      createdAt: customer.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: customer.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
