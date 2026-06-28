import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('ai')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  chat(@Body() body: { message: string }): { reply: string } {
    return this.chatService.chat(body.message);
  }
}
