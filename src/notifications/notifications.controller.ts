import { Body, Controller, Post, Sse } from '@nestjs/common';
import { interval, map, Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('notify')
  notify(@Body() body: { title?: string; body?: string }) {
    // broadcast the notification to connected clients
    this.notificationsService.send({
      title: body.title || 'Notification',
      body: body.body || 'New update available!',
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
