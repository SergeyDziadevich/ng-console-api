import { InputType, Field } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../enums/role.enum';

@InputType()
export class CreateUserSettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  receiveNotifications?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  receiveEmails?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  receiveSMS?: boolean;
}

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  username: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field(() => Role, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @Field(() => CreateUserSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserSettingsInput)
  settings?: CreateUserSettingsInput;
}
