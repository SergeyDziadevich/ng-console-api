import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSettings } from '../schemas/system-settings.schema';

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  constructor(
    @InjectModel(SystemSettings.name)
    private readonly systemSettingsModel: Model<SystemSettings>,
  ) {}

  async onModuleInit() {
    const settings = await this.systemSettingsModel.findOne().exec();
    if (!settings) {
      await this.systemSettingsModel.create({ auditRetentionDays: 30 });
    }
  }

  async getAuditRetentionDays(): Promise<number> {
    const settings = await this.systemSettingsModel.findOne().exec();
    return settings?.auditRetentionDays || 30;
  }

  async setAuditRetentionDays(days: number): Promise<void> {
    const settings = await this.systemSettingsModel.findOne().exec();
    if (!settings) {
      await this.systemSettingsModel.create({ auditRetentionDays: days });
    } else {
      settings.auditRetentionDays = days;
      await settings.save();
    }
  }
}
