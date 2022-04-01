import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventEmitter {
    constructor(private readonly eventEmitter2: EventEmitter2)
    {}

    public emit(eventType: string,event: any) {
        this.eventEmitter2.emit(eventType,event);
        return;
    }
}
