import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChatRoomMember } from './chat-room-member.entity';
import { ChatMessage } from './chat-message.entity';

@Entity()
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChatRoomMember, (member) => member.room, { cascade: true })
  members: ChatRoomMember[];

  @OneToMany(() => ChatMessage, (message) => message.room, { cascade: true })
  messages: ChatMessage[];
}
