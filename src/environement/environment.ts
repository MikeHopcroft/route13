import FastPriorityQueue from 'FastPriorityQueue';

import { Cart, CartId, Job, LocationId, SimTime } from "../types";
import { LoadTimeEstimator, TransitTimeEstimator, UnloadTimeEstimator } from '../types';
import { compileFunction } from 'vm';
import { rejects } from 'assert';

// TODO: Are cart events specific or just next tick of action plan? Are they promises?
// TODO: Are events comprehensive - e.g. COMPLETE_JOB event included so that we can log event stream?
// TODO: How do we track progress against a Plan?
export enum EventType {
    START_PLANNING,
    FINISH_PLANNING,
    CREATE_JOB,
    UPDATE_JOB,
    ARRIVED,
    RESUMED,
    UNLOADED,
    LOADED
}

export interface Event {
    type: EventType;
    time: SimTime;
}

export interface Event2 {
    time: SimTime;
    callback: (time: SimTime) => void;
}

// function foo()
// {
//     const eventComparator = (a: Event2, b: Event2) => a.time < b.time;
//     const q = new FastPriorityQueue<Event2>(eventComparator);
//     const p = new Promise((resolve, reject) => {
//         q.add({
//             time: 5,
//             callback: resolve
//         });
//     }).then((result) => {
//         q.add({
//             time: 5,
//             callback: resolve
//         });
//     });
// }

export interface CartEvent extends Event {
    type: EventType.ARRIVED | EventType.RESUMED | EventType.UNLOADED | EventType.LOADED;
    cart: Cart;
}

export interface JobEvent extends Event {
    type: EventType.CREATE_JOB;
    job: Job;
}

export class Environment {
    loadTimeEstimator: LoadTimeEstimator;
    unloadTimeEstimator: UnloadTimeEstimator;
    transitTimeEstimator: TransitTimeEstimator;

    time: SimTime;

    queue: FastPriorityQueue<Event>;
    fleet: Map<CartId, Cart>;


    // TODO: need some way to pass initial cart state.
    // TODO: need to provide estimator functions.
    // TODO: distinction between carts and plans.

    constructor(
        loadTimeEstimator: LoadTimeEstimator,
        unloadTimeEstimator: UnloadTimeEstimator,
        transitTimeEstimator: TransitTimeEstimator,
        events: IterableIterator<JobEvent>
    ) {
        this.loadTimeEstimator = loadTimeEstimator;
        this.unloadTimeEstimator = unloadTimeEstimator;
        this.transitTimeEstimator = transitTimeEstimator;

        // TODO: should this be the time of the first event?
        this.time = 0;

        this.fleet = new Map<CartId, Cart>();
        // TODO: initialize fleet.

        // Initialized event queue.
        const eventComparator = (a: Event, b: Event) => a.time < b.time;
        this.queue = new FastPriorityQueue(eventComparator);

        for (const event of events) {
            this.queue.add(event);
        }
    }

    // Returns true if there are more events.
    processNextEvent(): boolean {
        return false;
    }

    enqueue(time: SimTime, resolve: () => void): void {
        this.q2.add({
            time,
            resolve
        });
    }

    driveTo2(cart: Cart, destination: LocationId): Promise<void> {
        return new Promise((resolve, reject) => {
            const driveTime = this.transitTimeEstimator(cart.lastKnownLocation, destination, this.time);
            this.enqueue(this.time + driveTime, resolve);   
        })
    }

    wait2(cart: Cart, waitTime: SimTime): Promise<void> {
        // TODO: how to avoid enqueuing when waitTime is in the past?
        // Want to resolve the promise immediately.
        return new Promise((resolve, reject) => {
            if (waitTime > this.time) {
                this.enqueue(waitTime, resolve);
            }
            else {
                resolve();
            }    
        })
    }

    load2(cart: Cart, quantity: number): Promise<void> {

    }

    processPickupAction(cart: Cart, destination: LocationId) {
        // return new Promise((resolve, reject) => {
        //     this.driveTo
        // });
        this.driveTo2(cart, destination)
            .then(() => {
                // set location
                return this.wait2(cart, 1000);
            })
            .then(() => {
                return this.load2(cart, 5);
            })
    }


    driveTo(cart: Cart, destination: LocationId) {
        this.queue.add({
            type: EventType.ARRIVED,
            time: this.time + this.transitTimeEstimator(cart.lastKnownLocation, destination, this.time)
            // destination
        });
    }

    load(cart: Cart, quantity: number) {
        this.queue.add({
            type: EventType.LOADED,
            time: this.time + this.loadTimeEstimator(cart.lastKnownLocation, quantity, this.time)
            // quantity
        });
    }

    unload(cart: Cart, quantity: number) {
        this.queue.add({
            type: EventType.UNLOADED,
            time: this.time + this.unloadTimeEstimator(cart.lastKnownLocation, quantity, this.time)
            // quantity
        });
    }

    wait(cart: Cart, waitTime: SimTime) {
        this.queue.add({
            type: EventType.UNLOADED,
            time: this.time + waitTime
        });
    }
}