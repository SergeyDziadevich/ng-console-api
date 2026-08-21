import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AUDIT_PATTERNS,
  AuditLogDto,
  GetAuditLogsQuery,
  MICROSERVICE_SERVICES,
  SetRetentionCommand,
  SystemSettingsDto,
} from '@ng-console-api/contracts';
import { JwtAuthGuard, Roles, RolesGuard } from '@ng-console-api/common';
import { QueryAuditLogsDto, SetRetentionDto } from '../dto/audit.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('audit-logs')
export class AuditGatewayController {
  constructor(
    @Inject(MICROSERVICE_SERVICES.AUDIT_SERVICE)
    private readonly auditClient: ClientProxy,
  ) {}

  @Get()
  async getLogs(@Query() query: QueryAuditLogsDto): Promise<AuditLogDto[]> {
    const payload: GetAuditLogsQuery = {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 50,
      authorId: query.authorId,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate,
    };
    return firstValueFrom(
      this.auditClient.send<AuditLogDto[], GetAuditLogsQuery>(
        AUDIT_PATTERNS.GET_LOGS,
        payload,
      ),
    );
  }

  @Get('settings')
  async getSettings(): Promise<SystemSettingsDto> {
    return firstValueFrom(
      this.auditClient.send<SystemSettingsDto, Record<string, never>>(
        AUDIT_PATTERNS.GET_SETTINGS,
        {},
      ),
    );
  }

  @Post('retention')
  async setRetention(@Body() dto: SetRetentionDto): Promise<SystemSettingsDto> {
    const payload: SetRetentionCommand = {
      retentionDays: dto.retentionDays,
    };
    return firstValueFrom(
      this.auditClient.send<SystemSettingsDto, SetRetentionCommand>(
        AUDIT_PATTERNS.SET_RETENTION,
        payload,
      ),
    );
  }
}
