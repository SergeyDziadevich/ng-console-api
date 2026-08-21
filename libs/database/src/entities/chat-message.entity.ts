import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ChatRoom } from './chat-room.entity';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: 'CASCADE' })
  room: ChatRoom;

  @Column()
  roomId: string;

  @Column()
  senderId: string; // MongoDB User ID

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
