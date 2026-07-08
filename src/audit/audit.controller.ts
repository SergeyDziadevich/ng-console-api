import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';
import { SetRetentionDto } from './dto/set-retention.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('audit-logs')
@UseGuards(AuthGuard)
// TODO: add admin Guard
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(@Query() queryDto: GetAuditLogsDto) {
    return this.auditService.getLogs(queryDto);
  }

  @Get('actions')
  async getAvailableActions() {
    return this.auditService.getAvailableActions();
  }

  @Get('settings/retention')
  async getRetentionDays() {
    return this.auditService.getRetentionDays();
  }

  @Post('settings/retention')
  async setRetentionDays(@Body() body: SetRetentionDto) {
    return this.auditService.setRetentionDays(body.days);
  }
}
