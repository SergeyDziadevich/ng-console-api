import {
  AUTH_PATTERNS,
  USER_PATTERNS,
  TICKETS_PATTERNS,
  DOCUMENT_PATTERNS,
  PAYMENT_PATTERNS,
  CHAT_PATTERNS,
  NOTIFICATIONS_PATTERNS,
  AUDIT_PATTERNS,
  AI_PATTERNS,
  CUSTOMERS_PATTERNS,
  KAFKA_TOPICS,
} from './index';

describe('Contracts', () => {
  it('should define distinct auth patterns', () => {
    expect(AUTH_PATTERNS.SIGN_IN).toBe('auth.signIn');
    expect(AUTH_PATTERNS.GOOGLE_LOGIN).toBe('auth.googleLogin');
    expect(AUTH_PATTERNS.AUTHENTICATE_2FA).toBe('auth.authenticate2fa');
  });

  it('should define distinct user patterns', () => {
    expect(USER_PATTERNS.FIND_ALL).toBe('users.findAll');
    expect(USER_PATTERNS.CREATE).toBe('users.create');
  });

  it('should define distinct ticket patterns', () => {
    expect(TICKETS_PATTERNS.CREATE).toBe('tickets.create');
    expect(TICKETS_PATTERNS.BULK_UPDATE).toBe('tickets.bulkUpdate');
  });

  it('should define distinct document patterns', () => {
    expect(DOCUMENT_PATTERNS.UPLOAD).toBe('documents.upload');
    expect(DOCUMENT_PATTERNS.SIGN).toBe('documents.sign');
  });

  it('should define distinct payment patterns', () => {
    expect(PAYMENT_PATTERNS.CREATE_CHECKOUT).toBe('payments.createCheckout');
  });

  it('should define distinct chat patterns', () => {
    expect(CHAT_PATTERNS.SEND_MESSAGE).toBe('chat.sendMessage');
  });

  it('should define distinct notification patterns', () => {
    expect(NOTIFICATIONS_PATTERNS.GET_USER_NOTIFICATIONS).toBe(
      'notifications.getUserNotifications',
    );
  });

  it('should define distinct audit patterns', () => {
    expect(AUDIT_PATTERNS.GET_LOGS).toBe('audit.getLogs');
  });

  it('should define distinct AI patterns', () => {
    expect(AI_PATTERNS.GENERATE).toBe('ai.generate');
  });

  it('should define distinct customer patterns', () => {
    expect(CUSTOMERS_PATTERNS.FIND_ALL).toBe('customers.findAll');
  });

  it('should define Kafka topic constants', () => {
    expect(KAFKA_TOPICS.USER_CREATED).toBe('user.created');
    expect(KAFKA_TOPICS.TICKET_ASSIGNED).toBe('ticket.assigned');
    expect(KAFKA_TOPICS.SUBSCRIPTION_ACTIVATED).toBe('subscription.activated');
    expect(KAFKA_TOPICS.EMAIL_NOTIFICATION).toBe('email.notification');
    expect(KAFKA_TOPICS.AUDIT_LOGS).toBe('audit-logs');
  });
});
