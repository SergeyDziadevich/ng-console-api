export interface SendEmailCommand {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface EmailResultDto {
  success: boolean;
  messageId?: string;
  error?: string;
}
