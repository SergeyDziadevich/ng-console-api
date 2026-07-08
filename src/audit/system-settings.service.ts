import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSettings } from '../schemas/system-settings.schema';

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  private cachedRetentionDays: number = 30;

  constructor(
    @InjectModel(SystemSettings.name)
    private readonly systemSettingsModel: Model<SystemSettings>,
  ) {}

  async onModuleInit() {
    let settings = await this.systemSettingsModel.findOne().exec();
    if (!settings) {
      settings = await this.systemSettingsModel.create({
        auditRetentionDays: 30,
      });
    }
    this.cachedRetentionDays = settings.auditRetentionDays;
  }

  async getAuditRetentionDays(): Promise<number> {
    return Promise.resolve(this.cachedRetentionDays);
  }

  async setAuditRetentionDays(days: number): Promise<void> {
    const settings = await this.systemSettingsModel.findOne().exec();
    if (!settings) {
      await this.systemSettingsModel.create({ auditRetentionDays: days });
    } else {
      settings.auditRetentionDays = days;
      await settings.save();
    }
    this.cachedRetentionDays = days;
  }
}
