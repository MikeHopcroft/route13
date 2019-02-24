// TODO: Figure out why import on next line doesn't work.
//import FastPriorityQueue from 'fastpriorityqueue';
var FastPriorityQueue = require("fastpriorityqueue");

import { Continuation, NextStep, start } from './continuation';

// Current time in the simulation. Units are user-specified.
export type SimTime = number;

// The main event loop is driven by the Clock.
// The Clock maintains a priority queue of upcoming events, ordered by
// increasing time.
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

    // Processes events until the event queue is empty.
    mainloop() {
        while (true) {
            const event = this.queue.poll();
            if (event) {
                this.time = event.time;
                start(event.continuation);
            }
            else {
                break;
            }
        }
    }

    // Clock.until() is used to suspend a Continuation until a specified time
    // in the future. It creates a NextStep which, if yielded by a Continuation,
    // will cause the Continuation to be requeued for the specified time.
    until(time: SimTime): NextStep {
        return (continuation: Continuation) => {
            this.queue.add({ time, continuation })
        }
    }
}

// Events consist of a wakeup time and the Continuation to be woken.
interface Event {
    time: SimTime;
    continuation: Continuation;
}

