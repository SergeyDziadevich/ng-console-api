export const AUDIT_PATTERNS = {
  GET_LOGS: 'audit.getLogs',
  SET_RETENTION: 'audit.setRetention',
  GET_SETTINGS: 'audit.getSettings',
  LOG_EVENT: 'audit.logEvent',
} as const;

export interface GetAuditLogsQuery {
  page?: number;
  limit?: number;
  authorId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface SetRetentionCommand {
  retentionDays: number;
}

export interface AuditLogDto {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  authorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

export interface SystemSettingsDto {
  retentionDays: number;
  updatedAt: string;
}
