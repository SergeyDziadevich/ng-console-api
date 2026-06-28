import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  chat(message: string): { reply: string } {
    // TODO: replace with real AI/chat logic
    return { reply: `Echo: ${message}` };
  }
}
