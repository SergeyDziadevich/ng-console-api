import {
  User,
  UserSettings,
  Post,
  Document,
  DocumentChunk,
  Notification,
  NotificationReadState,
  AuditLog,
  SystemSettings,
  Role,
  Ticket,
  Comment,
  EpicTag,
  ChatRoom,
  ChatRoomMember,
  ChatMessage,
  Customer,
  CustomerLevel,
  TicketStatus,
  TicketPriority,
} from './index';

describe('Database Library Schemas and Entities', () => {
  it('should instantiate User and schema properties correctly', () => {
    const user = new User();
    user.email = 'test@example.com';
    user.username = 'testuser';
    user.role = Role.Admin;
    user.isTwoFactorEnabled = false;

    expect(user.email).toBe('test@example.com');
    expect(user.username).toBe('testuser');
    expect(user.role).toBe('admin');
    expect(user.isTwoFactorEnabled).toBe(false);
  });

  it('should instantiate UserSettings correctly', () => {
    const settings = new UserSettings();
    settings.receiveNotifications = true;
    settings.receiveEmails = false;

    expect(settings.receiveNotifications).toBe(true);
    expect(settings.receiveEmails).toBe(false);
  });

  it('should instantiate Post schema correctly', () => {
    const post = new Post();
    post.title = 'Hello World';
    post.contents = 'Post content here';

    expect(post.title).toBe('Hello World');
    expect(post.contents).toBe('Post content here');
  });

  it('should instantiate Document and DocumentChunk correctly', () => {
    const doc = new Document();
    doc.filename = 'spec.pdf';
    doc.mimeType = 'application/pdf';
    doc.size = 1024;
    doc.storageKey = 'docs/spec.pdf';

    const chunk = new DocumentChunk();
    chunk.text = 'Some extracted vector text';
    chunk.embedding = [0.1, 0.2, 0.3];

    expect(doc.filename).toBe('spec.pdf');
    expect(chunk.embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it('should instantiate Notification and NotificationReadState correctly', () => {
    const notification = new Notification();
    notification.title = 'New Alert';
    notification.body = 'Detailed body message';
    notification.ts = 1700000000;
    notification.isSystem = false;

    const readState = new NotificationReadState();
    readState.userId = 'user-123';
    readState.notificationId = 'notif-456';

    expect(notification.title).toBe('New Alert');
    expect(readState.userId).toBe('user-123');
  });

  it('should instantiate AuditLog and SystemSettings correctly', () => {
    const auditLog = new AuditLog();
    auditLog.action = 'USER_LOGIN';
    auditLog.entityType = 'User';
    auditLog.authorId = 'user-123';
    auditLog.metadata = { ip: '127.0.0.1' };

    const sysSettings = new SystemSettings();
    sysSettings.auditRetentionDays = 90;

    expect(auditLog.action).toBe('USER_LOGIN');
    expect(sysSettings.auditRetentionDays).toBe(90);
  });

  it('should instantiate Ticket, Comment, and EpicTag entities correctly', () => {
    const ticket = new Ticket();
    ticket.title = 'Fix Login Bug';
    ticket.description = 'Users cannot log in via 2FA';
    ticket.status = TicketStatus.IN_PROGRESS;
    ticket.priority = TicketPriority.HIGH;

    const comment = new Comment();
    comment.text = 'Investigating token expiry';
    comment.authorId = 'user-admin';

    const epic = new EpicTag();
    epic.name = 'Auth Revamp';

    expect(ticket.status).toBe('in progress');
    expect(ticket.priority).toBe('high');
    expect(comment.text).toBe('Investigating token expiry');
    expect(epic.name).toBe('Auth Revamp');
  });

  it('should instantiate ChatRoom, Member, and Message entities correctly', () => {
    const room = new ChatRoom();
    room.name = 'Engineering';

    const member = new ChatRoomMember();
    member.roomId = 'room-1';
    member.userId = 'user-1';

    const message = new ChatMessage();
    message.roomId = 'room-1';
    message.senderId = 'user-1';
    message.content = 'Hello team!';

    expect(room.name).toBe('Engineering');
    expect(member.userId).toBe('user-1');
    expect(message.content).toBe('Hello team!');
  });

  it('should instantiate Customer entity with enum levels correctly', () => {
    const customer = new Customer();
    customer.name = 'Acme Corp';
    customer.email = 'contact@acme.com';
    customer.level = CustomerLevel.ENTERPRISE;

    expect(customer.name).toBe('Acme Corp');
    expect(customer.level).toBe('enterprise');
  });
});
