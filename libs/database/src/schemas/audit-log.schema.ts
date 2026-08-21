import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog {
  _id?: mongoose.Types.ObjectId | string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  entityType: string;

  @Prop()
  entityId?: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  // TTL index: MongoDB automatically deletes the document when current time >= expiresAt
  @Prop({ index: { expires: 0 } })
  expiresAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type AuditLogDocument = AuditLog & mongoose.Document;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
