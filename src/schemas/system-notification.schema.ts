import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@ObjectType()
@Schema()
export class SystemNotification {
  @Field()
  @Prop({ required: true })
  title: string;

  @Field()
  @Prop({ required: true })
  body: string;

  @Field()
  @Prop({ required: true })
  ts: number;
}

export type SystemNotificationDocument = SystemNotification & Document;
export const SystemNotificationSchema =
  SchemaFactory.createForClass(SystemNotification);
