import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class Notification {
  @Field()
  @Prop({ required: true })
  title: string;

  @Field()
  @Prop({ required: true })
  body: string;

  @Field()
  @Prop({ required: true })
  ts: number;

  @Field()
  @Prop({ default: false })
  isSystem: boolean;

  @Field({ nullable: true })
  @Prop({ required: false })
  type?: string;

  @Field({ nullable: true })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: string;
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
