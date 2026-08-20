export const KAFKA_TOPICS = {
  USER_CREATED: 'user.created',
  TICKET_ASSIGNED: 'ticket.assigned',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  EMAIL_NOTIFICATION: 'email.notification',
  AUDIT_LOGS: 'audit-logs',
  DOCUMENT_SIGNED: 'document.signed',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

export interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
  role?: string;
  createdAt: string;
}

export interface TicketAssignedEvent {
  ticketId: string;
  title: string;
  userId: string;
  assignedBy?: string;
  priority?: string;
  timestamp: string;
}

export interface SubscriptionActivatedEvent {
  userId: string;
  email: string;
  name: string;
  planName: string;
  planId: string;
  manageLink: string;
  timestamp: string;
}

export interface EmailNotificationEvent {
  to: string;
  name: string;
  message: string;
  link?: string;
  subject?: string;
  template?: string;
  context?: Record<string, unknown>;
}

export interface AuditLogEvent {
  action: string;
  entityType?: string;
  entityId?: string;
  authorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentSignedEvent {
  documentId: string;
  title: string;
  signerEmail: string;
  signedAt: string;
  signedUrl?: string;
}
