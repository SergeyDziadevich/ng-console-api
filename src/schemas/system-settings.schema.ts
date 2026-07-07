import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SystemSettings extends Document {
  @Prop({ default: 30 })
  auditRetentionDays: number;
}

export const SystemSettingsSchema = SchemaFactory.createForClass(SystemSettings);
