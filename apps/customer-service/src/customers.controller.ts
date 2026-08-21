import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  CreateCustomerCommand,
  CustomerDto,
  CUSTOMERS_PATTERNS,
  UpdateCustomerCommand,
} from '@ng-console-api/contracts';
import { CustomersService } from './customers.service';

@Controller()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @MessagePattern(CUSTOMERS_PATTERNS.CREATE)
  async create(@Payload() data: CreateCustomerCommand): Promise<CustomerDto> {
    try {
      return await this.customersService.create(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Create customer failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(CUSTOMERS_PATTERNS.FIND_ALL)
  async findAll(): Promise<CustomerDto[]> {
    return this.customersService.findAll();
  }

  @MessagePattern(CUSTOMERS_PATTERNS.FIND_BY_ID)
  async findById(@Payload() data: { id: string }): Promise<CustomerDto> {
    try {
      return await this.customersService.findById(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Customer not found';
      throw new RpcException({ statusCode: 404, message });
    }
  }

  @MessagePattern(CUSTOMERS_PATTERNS.UPDATE)
  async update(@Payload() data: UpdateCustomerCommand): Promise<CustomerDto> {
    try {
      return await this.customersService.update(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Update customer failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(CUSTOMERS_PATTERNS.DELETE)
  async delete(@Payload() data: { id: string }): Promise<{ deleted: boolean }> {
    try {
      return await this.customersService.delete(data.id);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Delete customer failed';
      throw new RpcException({ statusCode: 404, message });
    }
  }
}
