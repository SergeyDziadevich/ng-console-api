import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AuditLogDto,
  AuditLogEvent,
  AUDIT_PATTERNS,
  GetAuditLogsQuery,
  SetRetentionCommand,
  SystemSettingsDto,
} from '@ng-console-api/contracts';
import { AuditService } from './audit.service';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @MessagePattern(AUDIT_PATTERNS.GET_LOGS)
  async getLogs(@Payload() data: GetAuditLogsQuery): Promise<AuditLogDto[]> {
    return this.auditService.getLogs(data);
  }

  @MessagePattern(AUDIT_PATTERNS.GET_SETTINGS)
  async getSettings(): Promise<SystemSettingsDto> {
    return this.auditService.getSettings();
  }

  @MessagePattern(AUDIT_PATTERNS.SET_RETENTION)
  async setRetention(
    @Payload() data: SetRetentionCommand,
  ): Promise<SystemSettingsDto> {
    return this.auditService.setRetention(data);
  }

  @MessagePattern(AUDIT_PATTERNS.LOG_EVENT)
  async logEvent(@Payload() data: AuditLogEvent): Promise<AuditLogDto> {
    return this.auditService.logEvent(data);
  }
}
