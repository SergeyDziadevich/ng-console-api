import { ConflictException, Injectable } from '@nestjs/common';
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
    try {
      if (settings) {
        const newSettings = new this.userSettingsModel(settings);
        const saveNewSettings = await newSettings.save();

        const newUser = new this.userModel({
          ...createUserDto,
          settings: saveNewSettings._id,
        });

        return await newUser.save();
      }

      const newUser = new this.userModel(createUserDto);

      return await newUser.save();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        const keyValue =
          (error as { keyValue?: Record<string, unknown> }).keyValue ?? {};
        const duplicatedField = Object.keys(keyValue)[0];
        throw new ConflictException(
          `A user with that ${duplicatedField ?? 'value'} already exists.`,
        );
      }
      throw error;
    }
  }

  getAllUsers(): Promise<User[]> {
    return this.userModel.find().populate(['settings', 'posts']);
  }

  getUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).populate('settings');
  }

  updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const { avatarUrl, ...rest } = updateUserDto;
    const updateData: Partial<User> = { ...rest };
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  deleteUser(id: string): Promise<DeleteResult> {
    return this.userModel.deleteOne({ _id: id }).exec();
  }

  findOne(username: string): Promise<HydratedDocument<User> | null> {
    return this.userModel.findOne({ username }).exec();
  }
}
