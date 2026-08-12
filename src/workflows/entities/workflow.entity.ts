import { Field, ID, ObjectType, InputType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@ObjectType()
@InputType('WorkflowActionInput')
export class WorkflowAction {
  @Field()
  type: string; // e.g., 'SAVE_TO_DRIVE', 'SLACK_ALERT'

  @Field({ nullable: true })
  target?: string;
}

@ObjectType()
@Entity('workflows')
export class Workflow {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  triggerType: string;

  @Field(() => [WorkflowAction], { nullable: true })
  @Column('jsonb', { default: [] })
  actions: WorkflowAction[];

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
