export const CHAT_PATTERNS = {
  GET_ROOMS: 'chat.getRooms',
  CREATE_ROOM: 'chat.createRoom',
  ADD_MEMBER: 'chat.addMember',
  GET_MESSAGES: 'chat.getMessages',
  SEND_MESSAGE: 'chat.sendMessage',
  DELETE_ROOM: 'chat.deleteRoom',
  UPDATE_ROOM: 'chat.updateRoom',
} as const;

export interface CreateRoomCommand {
  name: string;
  isDirect: boolean;
  createdBy: string;
  memberIds: string[];
}

export interface AddMemberCommand {
  roomId: string;
  userId: string;
  role?: string;
}

export interface SendMessageCommand {
  roomId: string;
  senderId: string;
  content: string;
  attachments?: string[];
}

export interface GetMessagesCommand {
  roomId: string;
  limit?: number;
  offset?: number;
}

export interface ChatRoomDto {
  id: string;
  name: string;
  isDirect: boolean;
  createdBy: string;
  members: ChatRoomMemberDto[];
  lastMessage?: ChatMessageDto;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomMemberDto {
  id: string;
  roomId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export interface ChatMessageDto {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  attachments?: string[];
  createdAt: string;
}
