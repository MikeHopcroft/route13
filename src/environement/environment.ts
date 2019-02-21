import FastPriorityQueue from 'FastPriorityQueue';

import { Condition } from './condition'
import { Continuation, resume } from './continuation';
import { RoutePlanner } from '../planner';
import { ActionType, AnyAction, DropoffAction, PickupAction, Plan, SuspendAction } from '../types'
import { AnyJob, Cart, CartId, LocationId, SimTime } from "../types";
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

interface Event {
    time: SimTime;
    continuation: Continuation;
}


export class Environment {
    //
    // Estimators and routing.
    //
    private loadTimeEstimator: LoadTimeEstimator;
    private routeNextStep: RouteNextStep;
    private unloadTimeEstimator: UnloadTimeEstimator;
    private transitTimeEstimator: TransitTimeEstimator;

    private routePlanner: RoutePlanner;

    //
    // State of the environment
    //
    private time: SimTime;
    private fleet: Map<CartId, Cart>;

    //
    // Eventing system
    //
    private shuttingDown: boolean;
    private queue: FastPriorityQueue<Event>;

    //
    // Job related
    //
    private unassignedJobs: AnyJob[];
    private jobAvailableCondition: Condition;

    private assignedJobs: Set<AnyJob>;
    private successfulJobs: AnyJob[];
    private failedJobs: AnyJob[];



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

        // TODO: should this be the time of the first event?
        this.time = 0;

        this.fleet = new Map<CartId, Cart>();
        // TODO: initialize fleet.

        this.unassignedJobs = [];
        this.assignedJobs = new Set<AnyJob>();
        this.successfulJobs = [];
        this.failedJobs = [];

        this.shuttingDown = false;
        const eventComparator = (a: Event, b: Event) => a.time < b.time;
        this.queue = new FastPriorityQueue<Event>(eventComparator);

        this.jobAvailableCondition = new Condition();

        const maxJobs = 2;
        this.routePlanner = new RoutePlanner(
            maxJobs,
            this.loadTimeEstimator,
            this.unloadTimeEstimator,
            this.transitTimeEstimator);
    }

    mainloop() {
        while (true) {
            const event = this.queue.poll();
            if (event) {
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

    waitForJob() {
        return (future: Continuation) => {
            this.jobAvailableCondition.sleep(future);
        }
    }

    *introduceJob(job: AnyJob, time: SimTime) {
        // TODO: it is possible to introduce a job after its start time. Is this ok?
        // Should we log and throw?
        yield* this.waitUntil(time);

        // TODO: add job to list of outstanding jobs.
        this.unassignedJobs.push(job);
        this.jobAvailableCondition.wakeOne();
    }

    // Simple agent processes one job at a time.
    // When finished, grabs next unassigned job in FIFO order.
    *agent(cart: Cart) {
        while (true) {
            // Wait for a job to become available.
            yield this.waitForJob();

            // Select a job, FIFO order.
            const job = this.unassignedJobs.shift() as AnyJob;
            this.assignedJobs.add(job);

            // Convert job to a plan.
            const plan = this.routePlanner.getBestRoute(cart, [job], this.time);

            // Execute plan.
            if (plan) {
                this.actionSequence(cart, plan.actions);
                this.assignedJobs.delete(job);
                this.successfulJobs.push(job);
            }
            else {
                // There is no plan that can complete this job.
                this.assignedJobs.delete(job);
                this.failedJobs.push(job);
            }
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
            yield this.until(this.time + driveTime);
            cart.lastKnownLocation = next;
        }
    }

    *load(cart: Cart, quantity: number) {
        if (cart.payload + quantity > cart.capacity) {
            const message = `cart ${cart.id} with ${cart.payload} will exceed capacity loading ${quantity} items.`
            throw TypeError(message);
        }
        const loadingFinishedTime = this.time + this.loadTimeEstimator(cart.lastKnownLocation, quantity, this.time);
        yield this.until(loadingFinishedTime);
        cart.payload += quantity;
    }

    *unload(cart: Cart, quantity: number) {
        if (cart.payload < quantity) {
            const message = `cart ${cart.id} with ${cart.payload} does not have ${quantity} items to unload.`
            throw TypeError(message);
        }
        const unloadingFinishedTime = this.time + this.unloadTimeEstimator(cart.lastKnownLocation, quantity, this.time);
        yield this.until(unloadingFinishedTime);
        cart.payload -= quantity;
    }

    *waitUntil(resumeTime: SimTime) {
        if (this.time < resumeTime) {
            yield this.until(resumeTime);
        }
    }
}

        //     logger(`PICKUP ${action.quantity} bags at gate ${action.location} after ${action.time} (job ${action.job.id})`);
        //     logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
        //     logger(`    ${state.time}: wait ${waitTime}s until ${action.time}`);
        //     logger(`    ${state.time}: load ${action.quantity} bags in ${loadTime}s.`);
