import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  Post,
  Role,
  User,
  UserDocument,
  UserSettings,
} from '@ng-console-api/database';
import {
  CreatePostCommand,
  CreateUserCommand,
  KAFKA_TOPICS,
  PostDto,
  UpdateUserCommand,
  UpdateUserSettingsCommand,
  UserCreatedEvent,
  UserDto,
  UserSettingsDto,
} from '@ng-console-api/contracts';
import { KafkaProducerService } from '@ng-console-api/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserSettings.name)
    private readonly userSettingsModel: Model<UserSettings>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createUser(
    cmd: CreateUserCommand,
    authorId?: string,
  ): Promise<UserDto> {
    try {
      const password = cmd.password || 'TemporaryPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userModel.create({
        email: cmd.email,
        username: cmd.username,
        password: hashedPassword,
        role: cmd.role ? (cmd.role as Role) : Role.User,
        isTwoFactorEnabled: cmd.isTwoFactorEnable ?? false,
      });

      const event: UserCreatedEvent = {
        userId: String(user._id),
        email: user.email,
        name: user.username,
        role: user.role,
        createdAt: new Date().toISOString(),
      };
      await this.kafkaProducer.emit(
        KAFKA_TOPICS.USER_CREATED,
        event,
        String(user._id),
      );

      await this.kafkaProducer.emit(
        KAFKA_TOPICS.AUDIT_LOGS,
        {
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: String(user._id),
          authorId: authorId || String(user._id),
          metadata: { email: user.email, username: user.username },
          createdAt: new Date().toISOString(),
        },
        String(user._id),
      );

      return this.mapToUserDto(user);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        throw new ConflictException(
          'A user with that email or username already exists',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.userModel
      .find()
      .populate('settings')
      .populate('posts')
      .exec();
    return users.map((u) => this.mapToUserDto(u));
  }

  async findById(id: string): Promise<UserDto> {
    const user = await this.userModel
      .findById(id)
      .populate('settings')
      .populate('posts')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.mapToUserDto(user);
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ? this.mapToUserDto(user) : null;
  }

  async updateUser(
    cmd: UpdateUserCommand,
    authorId?: string,
  ): Promise<UserDto> {
    const user = await this.userModel
      .findByIdAndUpdate(cmd.id, { $set: cmd.data }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${cmd.id} not found`);
    }

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: cmd.id,
        authorId: authorId || cmd.id,
        metadata: { updatedFields: Object.keys(cmd.data) },
        createdAt: new Date().toISOString(),
      },
      cmd.id,
    );

    return this.mapToUserDto(user);
  }

  async deleteUser(
    id: string,
    authorId?: string,
  ): Promise<{ deleted: boolean }> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.kafkaProducer.emit(
      KAFKA_TOPICS.AUDIT_LOGS,
      {
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: id,
        authorId: authorId || id,
        metadata: {},
        createdAt: new Date().toISOString(),
      },
      id,
    );

    return { deleted: true };
  }

  async getSettings(userId: string): Promise<UserSettingsDto> {
    const user = await this.userModel
      .findById(userId)
      .populate('settings')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const settings = user.settings as UserSettings | undefined;
    return {
      userId,
      notificationsEnabled: settings?.receiveNotifications ?? true,
      emailAlerts: settings?.receiveEmails ?? true,
    };
  }

  async updateSettings(
    cmd: UpdateUserSettingsCommand,
  ): Promise<UserSettingsDto> {
    const user = await this.userModel.findById(cmd.userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${cmd.userId} not found`);
    }

    if (user.settings) {
      await this.userSettingsModel.findByIdAndUpdate(user.settings, {
        receiveNotifications: cmd.settings.notificationsEnabled,
        receiveEmails: cmd.settings.emailAlerts,
      });
    } else {
      const newSettings = await this.userSettingsModel.create({
        receiveNotifications: cmd.settings.notificationsEnabled,
        receiveEmails: cmd.settings.emailAlerts,
      });
      user.settings = newSettings;
      await user.save();
    }

    return {
      userId: cmd.userId,
      theme: cmd.settings.theme,
      notificationsEnabled: cmd.settings.notificationsEnabled,
      emailAlerts: cmd.settings.emailAlerts,
      language: cmd.settings.language,
    };
  }

  async createPost(cmd: CreatePostCommand): Promise<PostDto> {
    const user = await this.userModel.findById(cmd.userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${cmd.userId} not found`);
    }

    const post = await this.postModel.create({
      title: cmd.title,
      contents: cmd.content,
    });

    user.posts = user.posts || [];
    user.posts.push(post);
    await user.save();

    return {
      id: String(post._id),
      userId: cmd.userId,
      title: post.title,
      content: post.contents,
      createdAt: new Date().toISOString(),
    };
  }

  async findPosts(userId: string): Promise<PostDto[]> {
    const user = await this.userModel.findById(userId).populate('posts').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const posts = (user.posts || []) as unknown as (Post & {
      _id: Types.ObjectId | string;
    })[];
    return posts.map((p) => ({
      id: String(p._id),
      userId,
      title: p.title,
      content: p.contents,
      createdAt: new Date().toISOString(),
    }));
  }

  private mapToUserDto(user: UserDocument): UserDto {
    return {
      id: String(user._id),
      email: user.email,
      username: user.username,
      role: user.role,
      isTwoFactorEnable: user.isTwoFactorEnabled,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeSubscriptionStatus: user.stripeSubscriptionStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
