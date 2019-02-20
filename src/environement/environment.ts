import FastPriorityQueue from 'FastPriorityQueue';

import { ActionType, AnyAction, DropoffAction, PickupAction, Plan, SuspendAction } from '../types'
import { Cart, CartId, Job, LocationId, SimTime } from "../types";
import { LoadTimeEstimator, RouteNextStep, TransitTimeEstimator, UnloadTimeEstimator } from '../types';

/*
Job initially enter the system via the event queue, using the introduceJob() method.
At the specified time, an introduced job becomes visible to the environment and is added to the backlog.
Jobs on the backlog may or may not be assigned to a cart at any given time.

The input to the planner consists of the job backlog, and the states of each of the carts.
The planner generates a job assignment, which consists of a set of jobs for each cart.
The new job assignment will always maintain the assignments of jobs that have already been started.

The new job assignment is merged with the current job assignment to produce the assignment, moving forward.

Race condition:
Cart is assigned A, B, C.
Cart starts on A.
    Planner starts.
    Cart finishes A and starts on B.
    Planner finishes with assignment A, C, D.
    How does cart merge [A, B, C] with [A, C, D]?
        Challenge: [C, D] might not be appropriate for cart doing B.
        Challenge: Taking the union of old and new assignments might make very complicated plan.

Idea: planner assumes cart has dibs on any task that can be started in planning window.
*/

export interface Event {
    time: SimTime;
    iterator: IterableIterator<SimTime>;
}

export class EventQueue {
    private queue: FastPriorityQueue<Event>;

    constructor() {
        const eventComparator = (a: Event, b: Event) => a.time < b.time;
        this.queue = new FastPriorityQueue<Event>(eventComparator);
    }

    // Enqueues an iterator for a specified time in the future.
    enqueue(time: SimTime, iterator: IterableIterator<SimTime>): void {
        this.queue.add({time, iterator});
    }

    // Processes the next event in the queue by advancing its iterator and
    // requeuing if the interator has yet to complete.
    // Returns false if the queue was empty.
    processNextEvent(): boolean {
        const event = this.queue.poll();
        if (event) {
            this.advanceIterator(event.iterator);
            return true;
        }
        return false;
    }

    advanceIterator(iterator: IterableIterator<SimTime>) {
        const { done, value } = iterator.next();
        if (!done) {
            this.enqueue(value, iterator);
        }
    }
}

export class Condition {
    // TODO: add counter.
    private queue: EventQueue;
    private iterators: IterableIterator<SimTime>[];
    private pendingWakeups: number;

    constructor(queue: EventQueue) {
        this.queue = queue;
        this.iterators = [];
        this.pendingWakeups = 0;
    }

    sleep(iterator: IterableIterator<SimTime>) {
        if (this.pendingWakeups > 0) {
            --this.pendingWakeups;
            this.queue.advanceIterator(iterator);
        }
        else {
            this.iterators.push(iterator);
        }
    }

    wakeAll() {
        while (this.iterators.length > 0) {
            this.wakeOne();
        }
    }

    wakeOne() {
        const iterator = this.iterators.shift();
        if (iterator) {
            this.queue.advanceIterator(iterator);
        }
        else {
            ++this.pendingWakeups;
        }
    }
}

export class Environment {
    private loadTimeEstimator: LoadTimeEstimator;
    private routeNextStep: RouteNextStep;
    private unloadTimeEstimator: UnloadTimeEstimator;
    private transitTimeEstimator: TransitTimeEstimator;

    private shuttingDown: boolean;

    private time: SimTime;

    // queue: FastPriorityQueue<Event>;
    private queue: EventQueue;

    private fleet: Map<CartId, Cart>;

    private unassignedJobs: Set<Job>;
    private assignedJobs: Map<CartId, Job>;

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

        this.unassignedJobs = new Set<Job>();
        this.assignedJobs = new Map<CartId, Job>();

        // Initialized event queue.
        this.queue = new EventQueue();
        // const eventComparator = (a: Event, b: Event) => a.time < b.time;
        // this.queue = new FastPriorityQueue(eventComparator);

        // for (const event of events) {
        //     this.queue.add(event);
        // }
    }

    // Processes the next event in the queue by advancing its iterator and
    // requeuing if the interator has yet to complete.
    // Returns false if the queue was empty.
    processNextEvent(): boolean {
        return this.queue.processNextEvent();
    }

    // Enqueues an iterator for a specified time in the future.
    enqueue(time: SimTime, iterator: IterableIterator<SimTime>): void {
        this.queue.enqueue(time, iterator);
    }

    *introduceJob(job: Job, time: SimTime) {
        // TODO: it is possible to introduce a job after its start time. Is this ok?
        // Should we log and throw?
        yield* this.waitUntil(time);

        // TODO: add job to list of outstanding jobs.
        this.unassignedJobs.add(job);
    }

    *agent(cart: Cart) {
        while (true) {
            // Select a job.
            //   What if there is no job available?
            // Convert job to a plan.
            // Execute plan.
        }
    }

    // updateJob?
    // cancelJob?

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

    *actionSequence(cart: Cart, actions: AnyAction[]) {
        for (const action of actions) {
            // TODO: before each action, check to see if there is a new action sequence.
            yield* this.action(cart, action);
        }
    }

    *action(cart: Cart, action: AnyAction) {
        // DESIGN NOTE: could eliminate this switch statement if Actions were classes.
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
        cart.payload += quantity;
    }

    *unload(cart: Cart, quantity: number) {
        if (cart.payload < quantity) {
            const message = `cart ${cart.id} with ${cart.payload} does not have ${quantity} items to unload.`
            throw TypeError(message);
        }
        const unloadingFinishedTime = this.time + this.unloadTimeEstimator(cart.lastKnownLocation, quantity, this.time);
        yield unloadingFinishedTime;
        cart.payload -= quantity;
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
