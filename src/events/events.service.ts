import { Injectable } from '@nestjs/common';
import { finalize, interval, map, merge, Subject } from 'rxjs';

@Injectable()
export class EventsService {
  private userStreams = new Map<string, Subject<any>>();

  private getOrCreateStream(userId: string): Subject<any> {
    if (!this.userStreams.has(userId)) {
      this.userStreams.set(userId, new Subject<any>());
    }
    return this.userStreams.get(userId)!;
  }

  getEvents$(userId: string) {
    const userStream = this.getOrCreateStream(userId);

    const keepAlive$ = interval(25000).pipe(map(() => ({ type: 'keepAlive' })));

    return merge(userStream.asObservable(), keepAlive$).pipe(
      finalize(() => {
        this.userStreams.delete(userId);
      }),
    );
  }
}
