import FastPriorityQueue from 'FastPriorityQueue';

import { Continuation, resume } from './continuation';
import { SimTime } from '../types';

interface Event {
    time: SimTime;
    continuation: Continuation;
}

export class Clock {
    private queue: FastPriorityQueue<Event>;
    time: SimTime;

    constructor() {
        const eventComparator = (a: Event, b: Event) => a.time < b.time;
        this.queue = new FastPriorityQueue<Event>(eventComparator);
        this.time = 0;
    }

    mainloop() {
        while (true) {
            const event = this.queue.poll();
            if (event) {
                this.time = event.time;
                resume(event.continuation);
            }
            else {
                break;
            }
        }
    }

    until(time: SimTime) {
        return (continuation: Continuation) => {
            this.queue.add({ time, continuation })
        }
    }
}