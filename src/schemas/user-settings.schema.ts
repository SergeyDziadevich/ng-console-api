import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@ObjectType()
@Schema()
export class UserSettings {
  @Field({ nullable: true })
  @Prop({ required: false })
  receiveNotifications?: boolean;

  @Field({ nullable: true })
  @Prop({ required: false })
  receiveEmails?: boolean;

  @Field({ nullable: true })
  @Prop({ required: false })
  receiveSMS?: boolean;

  @Field({ nullable: true })
  @Prop({ required: false })
  googleDriveRefreshToken?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  googleDriveSyncEnabled?: boolean;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);
