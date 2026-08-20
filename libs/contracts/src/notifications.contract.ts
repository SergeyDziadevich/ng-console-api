export const NOTIFICATIONS_PATTERNS = {
  GET_USER_NOTIFICATIONS: 'notifications.getUserNotifications',
  MARK_AS_READ: 'notifications.markAsRead',
  CREATE_NOTIFICATION: 'notifications.createNotification',
} as const;

export interface CreateNotificationCommand {
  userId?: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  broadcast?: boolean;
}

export interface MarkAsReadCommand {
  notificationId: string;
  userId: string;
}

export interface NotificationDto {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
