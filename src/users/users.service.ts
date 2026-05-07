import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  createUser(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new this.userModel(createUserDto);

    return newUser.save();
  }

  getAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  getUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }
}
