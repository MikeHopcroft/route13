import { Agent, Clock, SimTime } from '../core';
import { Cart, Environment, Job, LocationId, OutOfServiceJobState, Trace, TransferJobState } from '../environement';
import { ActionType, Action, DropoffAction, PickupAction, SuspendAction } from '../planner';

import { Dispatcher } from './dispatcher';

// The Driver performs the sequence of Actions necessary to complete the
// set of assigned Jobs.
export class Driver {
    private readonly clock: Clock;
    private readonly dispatcher: Dispatcher;
    private readonly env: Environment;
    private readonly trace: Trace | undefined;

    constructor(clock: Clock, dispatcher: Dispatcher, env: Environment, trace: Trace | undefined) {
        this.clock = clock;
        this.dispatcher = dispatcher;
        this.env = env;
        this.trace = trace;
    }

    // Agent that continuosly operates a single cart.
    // Current implementation processes one job at a time.
    // When finished, grabs next unassigned Job from the Dispatcher.
    *drive(cart: Cart): Agent {
        while (true) {
            // Wait for a job to become available.
            yield this.dispatcher.waitForJob();

            // let job = null;
            // for (const j of this.env.jobs.values()) {
            //     if (!j.assignedTo) {
            //         job = j;
            //         break;
            //     }
            // }

            // if (job) {
            {
                // Select a job, FIFO order.
                const job = this.env.unassignedJobs.shift() as Job;
                this.env.assignJob(job, cart);

                // Convert job to a plan.
                const plan = this.env.routePlanner.getBestRoute(cart, [job], this.clock.time);

                // Execute plan.
                if (plan) {
                    yield* this.performActionSequence(cart, plan.actions);
                }
                else {
                    // There is no plan for this cart to complete this job.
                    this.env.failJob(job);
                }
            }
        }
    }

    // Agent that continuosly operates a single cart.
    // This implementation takes new job assignments from the planning cycle.
    *drive2(cart: Cart): Agent {
        let currentPlanTime: SimTime = -Infinity;
        while (true) {
            // Wait for a new plan.
            yield *this.dispatcher.waitForNextPlan(currentPlanTime);

            // If we're shutting down, break out of the loop.
            if (this.dispatcher.shuttingDown) {
                break;
            }

            const jobs = this.dispatcher.currentPlan.get(cart);
            if (!jobs) {
                // There is no plan for this cart.
                // This seems like a bug, vs an empty plan.
                // TODO: Log or throw?
                throw TypeError();
            }
            else {
                // Begin executing the plan.
                yield* this.findRouteAndGo(cart, currentPlanTime, jobs);
            }
        }
    }

    private *findRouteAndGo(cart: Cart, currentPlanTime: SimTime, jobs: Job[]) {
        // Find a route that performs this list of jobs.
        const route = this.env.routePlanner.getBestRoute(cart, jobs, this.clock.time);

        if (!route) {
            // No route was found for this cart to complete this job.
            // THIS SHOULD NEVER HAPPEN, IF PLANNER PLANS FOR CORRECT TIME.
            // SOME RACE CONDITIONS MIGHT ALLOW THIS.
            //   start driving
            //   planner finishes
            //   much later finish driving
            //   now it's too late for plan to work
            // PROBABLY NEED SOME REPLAN STRATEGY WITH FEWER JOBS.
            // TODO: Handlr this case.
            throw TypeError();
            // this.env.failJob(job);
        }
        else {
            // Execute planned route, one action at a time.
            for (const action of route.actions) {
                if (currentPlanTime < this.dispatcher.currentPlanTime) {
                    // There's a new plan available. Break out of the loop to
                    // allow caller to merge in new plan.
                    break;
                }
                yield* this.performOneAction(cart, action);
            }
        }
    }

    // Agent that performs a sequence of Actions.
    private *performActionSequence(cart: Cart, actions: Action[]) {
        for (const action of actions) {
            // TODO: before each action, check to see if there is a new action sequence.
            yield* this.performOneAction(cart, action);
        }
    }

    // Agent that performs a single Action.
    private *performOneAction(cart: Cart, action: Action) {
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
                // Should never get here. Log and throw.
                const message = `Unknown action type ${(action as Action).type}`;
                throw TypeError(message);
        }
    }

    // Agent that picks up a load from a location.
    private *pickup(cart: Cart, action: PickupAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(cart, action.time);

        // Once we've finished waiting and started loading, we must claim this
        // job so it cannot be assigned to any other card.
        action.job.state = TransferJobState.ENROUTE;
        action.job.assignedTo = cart;

        yield* this.load(cart, action.quantity);
    }

    // Agent that drops a load off at a location.
    private *dropoff(cart: Cart, action: DropoffAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.unload(cart, action.quantity);
        this.env.completeJob(action.job);
    }

    // Agent that takes a cart out of service for a period of time.
    private *suspend(cart: Cart, action: SuspendAction) {
        yield* this.driveTo(cart, action.location);

        if (this.trace) {
            this.trace.cartSuspendsService(cart);
        }

        action.job.state = OutOfServiceJobState.ON_BREAK;
        yield* this.waitUntil(cart, action.resumeTime);

        if (this.trace) {
            this.trace.cartResumesService(cart);
        }
        this.env.completeJob(action.job);
    }

    // Agent that drives a cart to a specified destination.
    private *driveTo(cart: Cart, destination: LocationId) {
        const start = cart.lastKnownLocation;
        while (cart.lastKnownLocation !== destination) {
            const next = this.env.routeNextStep(cart.lastKnownLocation, destination, this.clock.time);
            const driveTime = this.env.transitTimeEstimator(cart.lastKnownLocation, next, this.clock.time);
            if (this.trace) {
                if (cart.lastKnownLocation === start) {
                    this.trace.cartDeparts(cart, destination);
                }
            }
            yield this.clock.until(this.clock.time + driveTime);
            cart.lastKnownLocation = next;
            if (this.trace) {
                if (cart.lastKnownLocation === destination) {
                    this.trace.cartArrives(cart);
                }
                else {
                    this.trace.cartPasses(cart);
                }
            }
        }
    }

    // Agent that loads items onto a cart.
    private *load(cart: Cart, quantity: number) {
        if (cart.payload + quantity > cart.capacity) {
            const message = `cart ${cart.id} with ${cart.payload} will exceed capacity loading ${quantity} items.`
            throw TypeError(message);
        }

        if (this.trace) {
            this.trace.cartBeginsLoading(cart, quantity);
        }

        const loadingFinishedTime = this.clock.time + this.env.loadTimeEstimator(cart.lastKnownLocation, quantity, this.clock.time);
        yield this.clock.until(loadingFinishedTime);
        cart.payload += quantity;

        if (this.trace) {
            this.trace.cartFinishesLoading(cart);
        }
    }

    // Agent that unloads items from a cart.
    private *unload(cart: Cart, quantity: number) {
        if (cart.payload < quantity) {
            const message = `cart ${cart.id} with ${cart.payload} does not have ${quantity} items to unload.`
            throw TypeError(message);
        }

        if (this.trace) {
            this.trace.cartBeginsUnloading(cart, quantity);
        }

        const unloadingFinishedTime = this.clock.time + this.env.unloadTimeEstimator(cart.lastKnownLocation, quantity, this.clock.time);
        yield this.clock.until(unloadingFinishedTime);
        cart.payload -= quantity;

        if (this.trace) {
            this.trace.cartFinishesUnloading(cart);
        }
    }

    // Agent that waits until a specified time.
    private *waitUntil(cart: Cart, resumeTime: SimTime) {
        if (this.clock.time < resumeTime) {
            if (this.trace) {
                this.trace.cartWaits(cart, resumeTime);
            }
            yield this.clock.until(resumeTime);
        }
    }
}
