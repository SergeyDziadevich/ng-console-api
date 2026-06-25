import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ChatRoom } from './chat-room.entity';

@Entity()
export class ChatRoomMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ChatRoom, (room) => room.members, { onDelete: 'CASCADE' })
  room: ChatRoom;

  @Column()
  roomId: string;

  @Column()
  userId: string; // MongoDB User ID

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastReadAt?: Date;
}
