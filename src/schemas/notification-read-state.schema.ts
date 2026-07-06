import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@ObjectType()
@Schema()
export class NotificationReadState {
  @Field()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Field()
  @Prop({ type: Types.ObjectId, ref: 'Notification', required: true })
  notificationId: string;
}

export type NotificationReadStateDocument = NotificationReadState & Document;
export const NotificationReadStateSchema = SchemaFactory.createForClass(NotificationReadState);
