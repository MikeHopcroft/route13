// TODO: Figure out why import on next line doesn't work.
//import FastPriorityQueue from 'fastpriorityqueue';
var FastPriorityQueue = require("fastpriorityqueue");

import { Continuation, NextStep, resume } from './continuation';
import { SimTime } from '../types';

interface Event {
    time: SimTime;
    continuation: Continuation;
}

export class Clock {
    // TODO: Figure out why impost doesn't work.
//    private queue: FastPriorityQueue<Event>;
    private queue: any;
    time: SimTime;

    constructor() {
        const eventComparator = (a: Event, b: Event) => a.time < b.time;
        this.queue = new FastPriorityQueue(eventComparator);
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

    until(time: SimTime): NextStep {
        return (continuation: Continuation) => {
            this.queue.add({ time, continuation })
        }
    }
}