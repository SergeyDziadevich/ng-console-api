import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  MICROSERVICE_SERVICES,
  USER_PATTERNS,
  UserDto,
  UserSettingsDto,
  PostDto,
  CreateUserCommand,
  UpdateUserCommand,
  UpdateUserSettingsCommand,
  CreatePostCommand,
} from '@ng-console-api/contracts';
import { CurrentUser, JwtAuthGuard, Public, UserContext } from '@ng-console-api/common';
import {
  CreatePostDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserSettingsDto,
} from '../dto/user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.USER_SERVICE)
    private readonly userClient: ClientProxy,
  ) {}

  @Public()
  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    const payload: CreateUserCommand = {
      email: dto.email,
      username: dto.username,
      password: dto.password,
      role: dto.role,
    };
    return firstValueFrom(
      this.userClient.send<UserDto, CreateUserCommand>(
        USER_PATTERNS.CREATE,
        payload,
      ),
    );
  }

  @Get()
  async findAll(): Promise<UserDto[]> {
    return firstValueFrom(
      this.userClient.send<UserDto[], Record<string, never>>(
        USER_PATTERNS.FIND_ALL,
        {},
      ),
    );
  }

  @Get('me')
  async getProfile(@CurrentUser() user: UserContext): Promise<UserDto> {
    return firstValueFrom(
      this.userClient.send<UserDto, { id: string }>(
        USER_PATTERNS.FIND_BY_ID,
        { id: user.id },
      ),
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserDto> {
    return firstValueFrom(
      this.userClient.send<UserDto, { id: string }>(
        USER_PATTERNS.FIND_BY_ID,
        { id },
      ),
    );
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    const payload: UpdateUserCommand = {
      id,
      data: dto,
    };
    return firstValueFrom(
      this.userClient.send<UserDto, UpdateUserCommand>(
        USER_PATTERNS.UPDATE,
        payload,
      ),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await firstValueFrom(
      this.userClient.send<void, { id: string }>(
        USER_PATTERNS.DELETE,
        { id },
      ),
    );
  }

  @Get(':id/settings')
  async getSettings(@Param('id') id: string): Promise<UserSettingsDto> {
    return firstValueFrom(
      this.userClient.send<UserSettingsDto, { userId: string }>(
        USER_PATTERNS.GET_SETTINGS,
        { userId: id },
      ),
    );
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<UserSettingsDto> {
    const payload: UpdateUserSettingsCommand = {
      userId: id,
      settings: dto,
    };
    return firstValueFrom(
      this.userClient.send<UserSettingsDto, UpdateUserSettingsCommand>(
        USER_PATTERNS.UPDATE_SETTINGS,
        payload,
      ),
    );
  }

  @Post(':id/posts')
  async createPost(
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
  ): Promise<PostDto> {
    const payload: CreatePostCommand = {
      userId: id,
      title: dto.title,
      content: dto.content,
    };
    return firstValueFrom(
      this.userClient.send<PostDto, CreatePostCommand>(
        USER_PATTERNS.CREATE_POST,
        payload,
      ),
    );
  }

  @Get(':id/posts')
  async findPosts(@Param('id') id: string): Promise<PostDto[]> {
    return firstValueFrom(
      this.userClient.send<PostDto[], { userId: string }>(
        USER_PATTERNS.FIND_POSTS,
        { userId: id },
      ),
    );
  }
}
