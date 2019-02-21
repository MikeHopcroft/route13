import FastPriorityQueue from 'FastPriorityQueue';

import { SimTime } from "../types";

export type NextStep = (continuation: IterableIterator<NextStep>) => void;
export type Continuation = IterableIterator<NextStep>;

export function resume(continuation: Continuation) {
    const { done, value } = continuation.next();
    const schedule = value;
    if (!done) {
        schedule(continuation);
    }
}

export interface Event {
    time: SimTime;
    continuation: Continuation;
}

export class EventQueue {
    private queue: FastPriorityQueue<Event>;

    constructor() {
        const eventComparator = (a: Event, b: Event) => a.time < b.time;
        this.queue = new FastPriorityQueue<Event>(eventComparator);
    }

    // Enqueues an iterator for a specified time in the future.
    enqueue(time: SimTime, continuation: Continuation): void {
        this.queue.add({time, continuation: continuation});
    }

    // Processes the next event in the queue by advancing its iterator and
    // requeuing if the interator has yet to complete.
    // Returns false if the queue was empty.
    processNextEvent(): boolean {
        const event = this.queue.poll();
        // TODO: need to set time here.
        if (event) {
            resume(event.continuation);
            return true;
        }
        return false;
    }
}



export class Condition {
    private queue: EventQueue;
    private continuations: Continuation[];
    private pendingWakeups: number;

    constructor(queue: EventQueue) {
        this.queue = queue;
        this.continuations = [];
        this.pendingWakeups = 0;
    }

    sleep(iterator: Continuation) {
        if (this.pendingWakeups > 0) {
            --this.pendingWakeups;
            resume(iterator);
        }
        else {
            this.continuations.push(iterator);
        }
    }

    wakeAll() {
        while (this.continuations.length > 0) {
            this.wakeOne();
        }
    }

    wakeOne() {
        const iterator = this.continuations.shift();
        if (iterator) {
            resume(iterator);
        }
        else {
            ++this.pendingWakeups;
        }
    }
}
