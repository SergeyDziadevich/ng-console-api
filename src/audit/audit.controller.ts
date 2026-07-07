import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLog } from '../schemas/audit-log.schema';
import { Model } from 'mongoose';
import { SystemSettingsService } from './system-settings.service';
// Using an existing AuthGuard, assuming we have one. In a real app we'd also check admin role here.
import { AuthGuard } from '../auth/auth.guard';

@Controller('audit-logs')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  @Get()
  async getLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search = '',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('actions') actions?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { authorId: { $regex: search, $options: 'i' } },
      ];
    }

    if (actions) {
      const actionsList = actions.split(',');
      query.action = { $in: actionsList };
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
        .limit(limitNum)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get('actions')
  async getAvailableActions() {
    return this.auditLogModel.distinct('action').exec();
  }

  @Get('settings/retention')
  async getRetentionDays() {
    const days = await this.systemSettingsService.getAuditRetentionDays();
    return { retentionDays: days };
  }

  @Post('settings/retention')
  async setRetentionDays(@Body('days') days: number) {
    await this.systemSettingsService.setAuditRetentionDays(days);

    await this.auditLogModel.updateMany(
      {},
      [
        {
          $set: {
            expiresAt: {
              $dateAdd: {
                startDate: '$createdAt',
                unit: 'day',
                amount: days,
              },
            },
          },
        },
      ],
    );

    return { success: true, retentionDays: days };
  }
}
