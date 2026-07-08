import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, HydratedDocument, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSettings } from '../schemas/user-settings.schema';

import { ProducerService } from '../kafka/producer.service';
import { AuditProducerService } from '../audit/audit-producer.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserSettings.name)
    private userSettingsModel: Model<UserSettings>,
    private readonly producerService: ProducerService,
    private readonly auditProducerService: AuditProducerService,
  ) {}

  async createUser(
    { settings, ...createUserDto }: CreateUserDto,
    authorId?: string,
  ): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const userDataWithHashedPassword = {
        ...createUserDto,
        password: hashedPassword,
      };

      let savedUser: User;
      if (settings) {
        const newSettings = new this.userSettingsModel(settings);
        const saveNewSettings = await newSettings.save();

        const newUser = new this.userModel({
          ...userDataWithHashedPassword,
          settings: saveNewSettings._id,
        });

        savedUser = await newUser.save();
      } else {
        const newUser = new this.userModel(userDataWithHashedPassword);
        savedUser = await newUser.save();
      }

      await this.producerService.produce({
        topic: 'user.created',
        messages: [
          {
            value: JSON.stringify({
              email: savedUser.email,
              name: savedUser.username,
            }),
          },
        ],
      });

      const logRequestBody = { ...createUserDto } as Record<string, unknown>;
      if (logRequestBody['password']) {
        logRequestBody['password'] = '[REDACTED]';
      }

      await this.auditProducerService.logAction(
        'USER_CREATED',
        'User',
        savedUser._id.toString(),
        authorId || 'SYSTEM', // Or current user if available in context
        {
          email: savedUser.email,
          username: savedUser.username,
          requestBody: logRequestBody,
        },
      );

      return savedUser;
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

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    authorId?: string,
  ): Promise<User | null> {
    const { avatarUrl, settings, ...rest } = updateUserDto;
    const updateData: Partial<User> = { ...rest };
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    if (settings) {
      const user = await this.userModel.findById(id);
      if (user && user.settings) {
        await this.userSettingsModel.findByIdAndUpdate(user.settings, settings);
      } else if (user) {
        const newSettings = new this.userSettingsModel(settings);
        const saveNewSettings = await newSettings.save();
        updateData.settings = saveNewSettings._id as unknown as UserSettings;
      }
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (updatedUser) {
      const logRequestBody = { ...updateUserDto } as Record<string, unknown>;
      if (logRequestBody['password']) {
        logRequestBody['password'] = '[REDACTED]';
      }

      await this.auditProducerService.logAction(
        'USER_UPDATED',
        'User',
        id,
        authorId || 'SYSTEM',
        {
          updatedFields: Object.keys(updateData),
          requestBody: logRequestBody,
        },
      );
    }

    return updatedUser;
  }

  async deleteUser(id: string, authorId?: string): Promise<DeleteResult> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount && result.deletedCount > 0) {
      await this.auditProducerService.logAction(
        'USER_DELETED',
        'User',
        id,
        authorId || 'SYSTEM',
        {},
      );
    }

    return result;
  }

  findOne(username: string): Promise<HydratedDocument<User> | null> {
    return this.userModel.findOne({ username }).exec();
  }

  findByEmail(email: string): Promise<HydratedDocument<User> | null> {
    return this.userModel.findOne({ email }).exec();
  }

  updateTwoFactor(
    id: string,
    data: { twoFactorSecret?: string; isTwoFactorEnabled?: boolean },
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true });
  }
}
