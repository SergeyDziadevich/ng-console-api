import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import mongoose from 'mongoose';
import { User } from '../schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../auth/models/auth.interface';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Post()
  createUser(
    @Body() createUserDto: CreateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const author = req.user
      ? `${req.user.username || req.user.email} (${req.user.sub})`
      : undefined;
    return this.usersService.createUser(createUserDto, author);
  }

  @UseGuards(AuthGuard)
  @Get()
  getUsers() {
    return this.usersService.getAllUsers();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User> {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new NotFoundException('User does not exist');

    const findUser = await this.usersService.getUserById(id);

    if (!findUser) throw new NotFoundException('User does not exist');

    return findUser;
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new NotFoundException('User does not exist');

    const author = req.user
      ? `${req.user.username || req.user.email} (${req.user.sub})`
      : undefined;
    const updateUser = await this.usersService.updateUser(
      id,
      updateUserDto,
      author,
    );

    if (!updateUser) throw new HttpException('User not found', 404);

    return updateUser;
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req: RequestWithUser) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new NotFoundException('User does not exist');

    const author = req.user
      ? `${req.user.username || req.user.email} (${req.user.sub})`
      : undefined;
    const deleteUser = await this.usersService.deleteUser(id, author);
    if (!deleteUser) throw new HttpException('User not found', 404);

    return;
  }
}
