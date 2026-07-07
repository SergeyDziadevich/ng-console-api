import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { interval, map, Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../auth/models/auth.interface';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(AuthGuard)
  @Get()
  getNotifications(@Req() req: RequestWithUser) {
    return this.notificationsService.getNotificationsForUser(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.notificationsService.markAsRead(req.user.sub, id);
  }

  @Post('notify')
  notify(
    @Body()
    body: {
      title?: string;
      body?: string;
      type?: string;
      userId?: string;
      msg?: string;
    },
  ) {
    // broadcast the notification to connected clients
    void this.notificationsService.send({
      title: body.title || 'Notification',
      body: body.body || body.msg || body.title || '',
      type: body.type,
      userId: body.userId,
    });
  }

  @Sse('stream')
  streamNotifications(): Observable<MessageEvent> {
    return interval(60 * 1000).pipe(
      map(
        () =>
          ({
            data: {
              message: 'New update from backend!',
              timestamp: new Date(),
            },
          }) as MessageEvent,
      ),
    );
  }
}
