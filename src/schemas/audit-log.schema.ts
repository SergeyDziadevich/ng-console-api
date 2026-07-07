import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  entityType: string;

  @Prop()
  entityId: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ type: Object })
  metadata: Record<string, unknown>;

  // TTL index: MongoDB automatically deletes the document when current time >= expiresAt
  @Prop({ index: { expires: 0 } })
  expiresAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
