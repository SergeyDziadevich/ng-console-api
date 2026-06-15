import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Comment } from './comment.entity';
import { EpicTag } from './epic-tag.entity';

export enum TicketStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in progress',
  DONE = 'done',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.TODO,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  // Storing the MongoDB User ID as a string
  @Column({ nullable: true })
  assignedPersonId: string;

  @Column({ nullable: true, type: 'text' })
  about: string;

  @Column({ nullable: true, type: 'int' })
  estimations: number;

  @OneToMany(() => Comment, (comment) => comment.ticket)
  comments: Comment[];

  @ManyToOne(() => EpicTag, { eager: true, nullable: true })
  epic: EpicTag;
}
