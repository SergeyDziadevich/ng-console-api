import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { UserSettings } from './user-settings.schema';
import { Post } from './post.schema';
import { Role } from '../users/enums/role.enum';

@ObjectType()
@Schema()
export class User {
  @Field(() => ID)
  _id: string;

  @Field()
  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Field()
  @Prop({ unique: true, required: true })
  username: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  displayName?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  avatarUrl?: string;

  @Field(() => UserSettings, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserSettings' })
  settings?: UserSettings;

  @Field(() => Role)
  @Prop({ type: String, enum: Role, default: Role.User })
  role: Role;

  @Field(() => [Post], { nullable: true })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    default: [],
  })
  posts?: Post[];

  @Prop({ required: false })
  twoFactorSecret?: string;

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;

  @Field({ nullable: true })
  @Prop({ required: false })
  stripeCustomerId?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  stripeSubscriptionId?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  stripeSubscriptionStatus?: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  planId?: string;
}

export type UserDocument = User & mongoose.Document;
export const UserSchema = SchemaFactory.createForClass(User);
