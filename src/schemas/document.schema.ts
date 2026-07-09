import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from './user.schema';

@ObjectType()
@Schema({ timestamps: true })
export class Document {
  @Field(() => ID)
  _id: string;

  @Field()
  @Prop({ required: true })
  filename: string;

  @Field()
  @Prop({ required: true })
  mimeType: string;

  @Field(() => Int)
  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  storageKey: string;

  @Prop({ unique: true, sparse: true })
  shareToken?: string;

  @Field(() => User)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  uploadedBy: User | mongoose.Types.ObjectId;

  @Prop({ default: false })
  isSigned?: boolean;

  @Prop()
  signedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export type DocumentDocument = Document & mongoose.Document;
export const DocumentSchema = SchemaFactory.createForClass(Document);
