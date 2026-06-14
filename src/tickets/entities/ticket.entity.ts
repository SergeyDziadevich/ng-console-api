import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Comment } from './comment.entity';

export enum TicketStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in progress',
  DONE = 'done',
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

  // Storing the MongoDB User ID as a string
  @Column({ nullable: true })
  assignedPersonId: string;

  @Column({ nullable: true, type: 'int' })
  estimations: number;

  @OneToMany(() => Comment, (comment) => comment.ticket)
  comments: Comment[];
}
