import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class SystemSettings {
  _id?: mongoose.Types.ObjectId | string;

  @Prop({ default: 30 })
  auditRetentionDays: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SystemSettingsDocument = SystemSettings & mongoose.Document;
export const SystemSettingsSchema =
  SchemaFactory.createForClass(SystemSettings);
