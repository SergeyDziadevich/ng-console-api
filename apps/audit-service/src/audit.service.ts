import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, SystemSettings } from '@ng-console-api/database';
import {
  AuditLogDto,
  AuditLogEvent,
  GetAuditLogsQuery,
  SetRetentionCommand,
  SystemSettingsDto,
} from '@ng-console-api/contracts';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
    @InjectModel(SystemSettings.name)
    private readonly settingsModel: Model<SystemSettings>,
  ) {}

  async logEvent(event: AuditLogEvent): Promise<AuditLogDto> {
    const settings = await this.getSettings();
    const retentionDays = settings.retentionDays || 30;

    const createdAt = event.createdAt ? new Date(event.createdAt) : new Date();
    const expiresAt = new Date(
      createdAt.getTime() + retentionDays * 24 * 60 * 60 * 1000,
    );

    const log = await this.auditLogModel.create({
      action: event.action,
      entityType: event.entityType || 'Unknown',
      entityId: event.entityId,
      authorId: event.authorId,
      metadata: event.metadata || {},
      expiresAt,
    });

    this.logger.log(`Audit log stored: ${event.action} by ${event.authorId}`);

    return {
      id: String(log._id),
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      authorId: log.authorId,
      metadata: log.metadata,
      createdAt: log.createdAt
        ? (log.createdAt as Date).toISOString()
        : new Date().toISOString(),
      expiresAt: log.expiresAt?.toISOString(),
    };
  }

  async getLogs(query: GetAuditLogsQuery): Promise<AuditLogDto[]> {
    const filter: Record<string, unknown> = {};

    if (query.authorId) filter['authorId'] = query.authorId;
    if (query.action) filter['action'] = query.action;
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) dateFilter['$gte'] = new Date(query.startDate);
      if (query.endDate) dateFilter['$lte'] = new Date(query.endDate);
      filter['createdAt'] = dateFilter;
    }

    const page = query.page || 1;
    const limit = query.limit || 50;

    const logs = await this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return logs.map((l) => ({
      id: String(l._id),
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      authorId: l.authorId,
      metadata: l.metadata,
      createdAt: l.createdAt
        ? (l.createdAt as Date).toISOString()
        : new Date().toISOString(),
      expiresAt: l.expiresAt?.toISOString(),
    }));
  }

  async getSettings(): Promise<SystemSettingsDto> {
    let settings = await this.settingsModel.findOne().exec();
    if (!settings) {
      settings = await this.settingsModel.create({ auditRetentionDays: 30 });
    }
    return {
      retentionDays: settings.auditRetentionDays,
      updatedAt: settings.updatedAt
        ? (settings.updatedAt as Date).toISOString()
        : new Date().toISOString(),
    };
  }

  async setRetention(cmd: SetRetentionCommand): Promise<SystemSettingsDto> {
    let settings = await this.settingsModel.findOne().exec();
    if (!settings) {
      settings = await this.settingsModel.create({
        auditRetentionDays: cmd.retentionDays,
      });
    } else {
      settings.auditRetentionDays = cmd.retentionDays;
      await settings.save();
    }

    return {
      retentionDays: settings.auditRetentionDays,
      updatedAt: new Date().toISOString(),
    };
  }
}
