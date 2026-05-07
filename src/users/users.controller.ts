import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import mongoose from 'mongoose';
import { User } from '../schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  getUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User> {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new NotFoundException('User does not exist');

    const findUser = await this.usersService.getUserById(id);

    if (!findUser) throw new NotFoundException('User does not exist');

    return findUser;
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new NotFoundException('User does not exist');

    return this.usersService.updateUser(id, updateUserDto);
  }
}
