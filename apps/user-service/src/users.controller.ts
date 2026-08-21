import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  CreatePostCommand,
  CreateUserCommand,
  PostDto,
  UpdateUserCommand,
  UpdateUserSettingsCommand,
  UserDto,
  USER_PATTERNS,
  UserSettingsDto,
} from '@ng-console-api/contracts';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(USER_PATTERNS.CREATE)
  async createUser(@Payload() data: CreateUserCommand): Promise<UserDto> {
    try {
      return await this.usersService.createUser(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'User creation failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(USER_PATTERNS.FIND_ALL)
  async findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @MessagePattern(USER_PATTERNS.FIND_BY_ID)
  async findById(@Payload() data: { id: string }): Promise<UserDto> {
    try {
      return await this.usersService.findById(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'User not found';
      throw new RpcException({ statusCode: 404, message });
    }
  }

  @MessagePattern(USER_PATTERNS.FIND_BY_EMAIL)
  async findByEmail(
    @Payload() data: { email: string },
  ): Promise<UserDto | null> {
    return this.usersService.findByEmail(data.email);
  }

  @MessagePattern(USER_PATTERNS.UPDATE)
  async updateUser(@Payload() data: UpdateUserCommand): Promise<UserDto> {
    try {
      return await this.usersService.updateUser(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update user failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(USER_PATTERNS.DELETE)
  async deleteUser(
    @Payload() data: { id: string },
  ): Promise<{ deleted: boolean }> {
    try {
      return await this.usersService.deleteUser(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete user failed';
      throw new RpcException({ statusCode: 404, message });
    }
  }

  @MessagePattern(USER_PATTERNS.GET_SETTINGS)
  async getSettings(
    @Payload() data: { userId: string },
  ): Promise<UserSettingsDto> {
    try {
      return await this.usersService.getSettings(data.userId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Settings not found';
      throw new RpcException({ statusCode: 404, message });
    }
  }

  @MessagePattern(USER_PATTERNS.UPDATE_SETTINGS)
  async updateSettings(
    @Payload() data: UpdateUserSettingsCommand,
  ): Promise<UserSettingsDto> {
    try {
      return await this.usersService.updateSettings(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Update settings failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(USER_PATTERNS.CREATE_POST)
  async createPost(@Payload() data: CreatePostCommand): Promise<PostDto> {
    try {
      return await this.usersService.createPost(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Create post failed';
      throw new RpcException({ statusCode: 400, message });
    }
  }

  @MessagePattern(USER_PATTERNS.FIND_POSTS)
  async findPosts(@Payload() data: { userId: string }): Promise<PostDto[]> {
    try {
      return await this.usersService.findPosts(data.userId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Find posts failed';
      throw new RpcException({ statusCode: 404, message });
    }
  }
}
