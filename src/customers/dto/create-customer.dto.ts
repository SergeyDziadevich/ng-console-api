import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsEmail,
  IsUUID,
} from 'class-validator';
import { CustomerLevel } from '../entities/customer.entity';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(CustomerLevel)
  level?: CustomerLevel;

  @IsOptional()
  informations?: Record<string, unknown> | string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
