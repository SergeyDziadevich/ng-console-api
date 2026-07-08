import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from '../schemas/audit-log.schema';
import { SystemSettingsService } from './system-settings.service';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async getLogs(queryDto: GetAuditLogsDto) {
    const {
      page = 1,
      limit = 50,
      search,
      startDate,
      endDate,
      actions,
    } = queryDto;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { authorId: { $regex: search, $options: 'i' } },
      ];
    }

    if (actions && actions.length > 0) {
      query.action = { $in: actions };
    }

    if (startDate || endDate) {
      const createdAtQuery: Record<string, any> = {};
      if (startDate) {
        createdAtQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        createdAtQuery.$lte = end;
      }
      query.createdAt = createdAtQuery;
    }

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAvailableActions() {
    return this.auditLogModel.distinct('action').exec();
  }

  async getRetentionDays() {
    const days = await this.systemSettingsService.getAuditRetentionDays();

    return { retentionDays: days };
  }

  async setRetentionDays(days: number) {
    await this.systemSettingsService.setAuditRetentionDays(days);

    return { success: true, retentionDays: days };
  }
}
