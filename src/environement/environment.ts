import FastPriorityQueue from 'FastPriorityQueue';

import { ActionType, AnyAction, DropoffAction, PickupAction, Plan, SuspendAction } from '../types'
import { Cart, CartId, Job, LocationId, SimTime } from "../types";
import { LoadTimeEstimator, RouteNextStep, TransitTimeEstimator, UnloadTimeEstimator } from '../types';

export interface Event {
    time: SimTime;
    next: IterableIterator<SimTime>;
}

export class Environment {
    loadTimeEstimator: LoadTimeEstimator;
    routeNextStep: RouteNextStep;
    unloadTimeEstimator: UnloadTimeEstimator;
    transitTimeEstimator: TransitTimeEstimator;

    shuttingDown: boolean;

    time: SimTime;

    queue: FastPriorityQueue<Event>;
    fleet: Map<CartId, Cart>;

    // TODO: need some way to pass initial cart state.
    // TODO: distinction between carts and plans.

    constructor(
        loadTimeEstimator: LoadTimeEstimator,
        unloadTimeEstimator: UnloadTimeEstimator,
        routeNextStep: RouteNextStep,
        transitTimeEstimator: TransitTimeEstimator //,
        // events: IterableIterator<JobEvent>
    ) {
        this.loadTimeEstimator = loadTimeEstimator;
        this.routeNextStep = routeNextStep;
        this.unloadTimeEstimator = unloadTimeEstimator;
        this.transitTimeEstimator = transitTimeEstimator;

        this.shuttingDown = false;

        // TODO: should this be the time of the first event?
        this.time = 0;

        this.fleet = new Map<CartId, Cart>();
        // TODO: initialize fleet.

        // Initialized event queue.
        const eventComparator = (a: Event, b: Event) => a.time < b.time;
        this.queue = new FastPriorityQueue(eventComparator);

        // for (const event of events) {
        //     this.queue.add(event);
        // }
    }

    *introduceJob(job: Job, time: SimTime) {
        // TODO: it is possible to introduce a job after its start time. Is this ok?
        // Should we log and throw?
        yield* this.waitUntil(time);

        // TODO: add job to list of outstanding jobs.
    }

    // updateJob?
    // cancelJob?

    // Returns true if there are more events.
    processNextEvent(): boolean {
        return false;
    }

    enqueue(time: SimTime, next: IterableIterator<SimTime>): void {
        this.queue.add({time, next});
    }

    *planningLoop() {
        while (!this.shuttingDown) {
            yield* this.updateJobAssignments();
        }
    }

    *updateJobAssignments() {
        // Determine new job assignments
        //   Send cart and job state to planner.
        //   Get back new collection of job assignments.

        // For now, just simulate time to plan.
        const planningTime = 5000;
        yield this.time + planningTime;

        // Apply job assignments.
        //   Merge each new assignment into an existing assignment.
        // For now, simulate application of plan by doing nothing.
    }

    *actionSequenxce(cart: Cart, actions: AnyAction[]) {
        for (const action of actions) {
            yield* this.action(cart, action);
        }
    }

    *action(cart: Cart, action: AnyAction) {
        switch (action.type) {
            case ActionType.DROPOFF:
                yield* this.dropoff(cart, action);
                break;
            case ActionType.PICKUP:
                yield* this.pickup(cart, action);
                break;
            case ActionType.SUSPEND:
                yield* this.suspend(cart, action);
                break;
            default:
                // TODO: should generators return error/success?
                // What would the event loop do with this information?
                // Should never get here. Log and throw.
                const message = `Unknown action type ${(action as AnyAction).type}`;
                throw TypeError(message);
        }
    }

    *pickup(cart: Cart, action: PickupAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(action.time);
        yield* this.load(cart, action.quantity);
    }

    *dropoff(cart: Cart, action: DropoffAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(action.time);
        yield* this.unload(cart, action.quantity);
    }

    *suspend(cart: Cart, action: SuspendAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(action.resumeTime);
    }

    *driveTo(cart: Cart, destination: LocationId) {
        while (cart.lastKnownLocation !== destination) {
            const next = this.routeNextStep(cart.lastKnownLocation, destination, this.time);
            const driveTime = this.transitTimeEstimator(cart.lastKnownLocation, next, this.time);
            yield this.time + driveTime;
            cart.lastKnownLocation = next;
        }
    }

    *load(cart: Cart, quantity: number) {
        if (cart.payload + quantity > cart.capacity) {
            const message = `cart ${cart.id} with ${cart.payload} will exceed capacity loading ${quantity} items.`
            throw TypeError(message);
        }
        const loadingFinishedTime = this.time + this.loadTimeEstimator(cart.lastKnownLocation, quantity, this.time);
        yield loadingFinishedTime;
    }

    *unload(cart: Cart, quantity: number) {
        if (cart.payload < quantity) {
            const message = `cart ${cart.id} with ${cart.payload} does not have ${quantity} items to unload.`
            throw TypeError(message);
        }
        const unloadingFinishedTime = this.time + this.unloadTimeEstimator(cart.lastKnownLocation, quantity, this.time);
        yield unloadingFinishedTime;
    }

    *waitUntil(resumeTime: SimTime) {
        if (this.time < resumeTime) {
            yield resumeTime;
        }
    }
}

        //     logger(`PICKUP ${action.quantity} bags at gate ${action.location} after ${action.time} (job ${action.job.id})`);
        //     logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
        //     logger(`    ${state.time}: wait ${waitTime}s until ${action.time}`);
        //     logger(`    ${state.time}: load ${action.quantity} bags in ${loadTime}s.`);
