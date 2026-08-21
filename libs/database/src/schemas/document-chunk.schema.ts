import { Field, ID, ObjectType, Float } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from './document.schema';

@ObjectType()
@Schema({ timestamps: true })
export class DocumentChunk {
  @Field(() => ID)
  _id: string;

  @Field(() => Document)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true,
  })
  documentId: Document | mongoose.Types.ObjectId;

  @Field()
  @Prop({ required: true })
  text: string;

  @Field(() => [Float])
  @Prop({ type: [Number], required: true })
  embedding: number[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export type DocumentChunkDocument = DocumentChunk & mongoose.Document;
export const DocumentChunkSchema = SchemaFactory.createForClass(DocumentChunk);
