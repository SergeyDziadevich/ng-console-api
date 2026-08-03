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

  @Prop({
    type: String,
    enum: ['DRAFT', 'SIGNED_BY_PARTY_A', 'INVITATION_SENT', 'FULLY_SIGNED'],
    default: 'DRAFT',
  })
  status?: string;

  @Prop()
  externalPartyEmail?: string;

  @Prop({ unique: true, sparse: true })
  externalSignatureToken?: string;

  @Prop()
  externalSignatureTokenExpiresAt?: Date;

  @Prop({ default: false })
  isSigned?: boolean;

  @Prop()
  signedAt?: Date;

  @Prop()
  partyASignatureName?: string;

  @Prop()
  partyBSignatureName?: string;

  @Prop()
  partyBSignedAt?: Date;

  @Field()
  @Prop({ default: false })
  isRagProcessed?: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export type DocumentDocument = Document & mongoose.Document;
export const DocumentSchema = SchemaFactory.createForClass(Document);
