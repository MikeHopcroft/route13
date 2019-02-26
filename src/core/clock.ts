// TODO: Figure out why import on next line doesn't work.
//import FastPriorityQueue from 'fastpriorityqueue';
var FastPriorityQueue = require("fastpriorityqueue");

import { Agent, NextStep, start } from './agent';

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
                start(event.agent);
            }
            else {
                break;
            }
        }
    }

    // Clock.until() is used to suspend an Agent until a specified time
    // in the future. It creates a NextStep which, if yielded by an Agent,
    // will cause the Agent to be requeued for the specified time.
    until(time: SimTime): NextStep {
        return (agent: Agent) => {
            this.queue.add({ time, agent })
        }
    }
}

// Events consist of a wakeup time and the Agent to be woken.
interface Event {
    time: SimTime;
    agent: Agent;
}

