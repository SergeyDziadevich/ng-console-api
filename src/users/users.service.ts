import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, HydratedDocument, Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSettings } from '../schemas/user-settings.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserSettings.name)
    private userSettingsModel: Model<UserSettings>,
  ) {}

  async createUser({
    settings,
    ...createUserDto
  }: CreateUserDto): Promise<User> {
    if (settings) {
      const newSettings = new this.userSettingsModel(settings);
      const saveNewSettings = await newSettings.save();

      const newUser = new this.userModel({
        ...createUserDto,
        settings: saveNewSettings._id,
      });

      return newUser.save();
    }

    const newUser = new this.userModel(createUserDto);

    return newUser.save();
  }

  getAllUsers(): Promise<User[]> {
    return this.userModel.find().populate(['settings', 'posts']);
  }

  getUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).populate('settings');
  }

  updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
  }

  deleteUser(id: string): Promise<DeleteResult> {
    return this.userModel.deleteOne({ _id: id }).exec();
  }

  findOne(username: string): Promise<HydratedDocument<User> | null> {
    return this.userModel.findOne({ username }).exec();
  }
}
