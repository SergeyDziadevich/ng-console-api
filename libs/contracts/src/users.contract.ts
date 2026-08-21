export const USER_PATTERNS = {
  FIND_ALL: 'users.findAll',
  FIND_BY_ID: 'users.findById',
  FIND_BY_EMAIL: 'users.findByEmail',
  CREATE: 'users.create',
  UPDATE: 'users.update',
  DELETE: 'users.delete',
  UPDATE_SETTINGS: 'users.updateSettings',
  GET_SETTINGS: 'users.getSettings',
  CREATE_POST: 'users.createPost',
  FIND_POSTS: 'users.findPosts',
} as const;

export interface CreateUserCommand {
  email: string;
  password?: string;
  username: string;
  role?: string;
  isTwoFactorEnable?: boolean;
}

export interface UpdateUserCommand {
  id: string;
  data: {
    username?: string;
    email?: string;
    role?: string;
    twoFactorSecret?: string;
    isTwoFactorEnable?: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripeSubscriptionStatus?: string;
  };
}

export interface UpdateUserSettingsCommand {
  userId: string;
  settings: {
    theme?: string;
    notificationsEnabled?: boolean;
    emailAlerts?: boolean;
    language?: string;
  };
}

export interface CreatePostCommand {
  userId: string;
  title: string;
  content: string;
}

export interface UserDto {
  id: string;
  email: string;
  username: string;
  role?: string;
  isTwoFactorEnable?: boolean;
  twoFactorSecret?: string;
  password?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettingsDto {
  userId: string;
  theme?: string;
  notificationsEnabled?: boolean;
  emailAlerts?: boolean;
  language?: string;
}

export interface PostDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt?: string;
}
