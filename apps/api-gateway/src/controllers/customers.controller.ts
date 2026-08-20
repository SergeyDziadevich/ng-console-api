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
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateCustomerCommand,
  CustomerDto,
  CUSTOMERS_PATTERNS,
  MICROSERVICE_SERVICES,
  UpdateCustomerCommand,
} from '@ng-console-api/contracts';
import { JwtAuthGuard } from '@ng-console-api/common';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto/customer.dto';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.CUSTOMER_SERVICE)
    private readonly customerClient: ClientProxy,
  ) {}

  @Get()
  async findAll(): Promise<CustomerDto[]> {
    return firstValueFrom(
      this.customerClient.send<CustomerDto[], Record<string, never>>(
        CUSTOMERS_PATTERNS.FIND_ALL,
        {},
      ),
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<CustomerDto> {
    return firstValueFrom(
      this.customerClient.send<CustomerDto, { id: string }>(
        CUSTOMERS_PATTERNS.FIND_BY_ID,
        { id },
      ),
    );
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerDto> {
    const payload: CreateCustomerCommand = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      parentId: dto.parentId,
    };
    return firstValueFrom(
      this.customerClient.send<CustomerDto, CreateCustomerCommand>(
        CUSTOMERS_PATTERNS.CREATE,
        payload,
      ),
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerDto> {
    const payload: UpdateCustomerCommand = {
      id,
      data: dto,
    };
    return firstValueFrom(
      this.customerClient.send<CustomerDto, UpdateCustomerCommand>(
        CUSTOMERS_PATTERNS.UPDATE,
        payload,
      ),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await firstValueFrom(
      this.customerClient.send<void, { id: string }>(
        CUSTOMERS_PATTERNS.DELETE,
        { id },
      ),
    );
  }
}
