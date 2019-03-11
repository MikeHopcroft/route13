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
    // This implementation takes new job assignments from the planning cycle.
    *drive(cart: Cart): Agent {
        let currentPlanTime: SimTime = -Infinity;
        while (true) {
            // Wait for a new plan.
            // console.log(`cart ${cart.id} driver about to waitForNextPlan(${currentPlanTime})`);
            yield* this.dispatcher.waitForNextPlan(currentPlanTime);

            // If we're shutting down, break out of the loop.
            if (this.dispatcher.isShuttingDown()) {
                break;
            }
          
            // Begin executing the plan.
            currentPlanTime = this.clock.time;
            const jobs = this.dispatcher.getPlan(cart, this.env.jobs);
            if (this.trace) {
                this.trace.cartPlanIs(cart, jobs);
            }
            if (jobs.length > 0) {
                yield* this.findRouteAndGo(cart, currentPlanTime, jobs);
            }
        }
    }

    private *findRouteAndGo(cart: Cart, currentPlanTime: SimTime, jobs: Job[]) {
        // Find a route that performs this list of jobs.
        const route = this.env.routePlanner.getBestRoute(cart, jobs, this.clock.time);

        if (!route) {
            // No route was found for this cart to complete this job.
            //
            // This could happen if the cart performs a long-running action
            // that makes it impossible to complete all of the newly assigned
            // jobs.
            //
            // In general, the planner should be aware of the cart's current
            // action but unexpected conditions (e.g. weather, mechanical
            // issues, etc.) could invalidate the plan.

            // PROBABLY NEED SOME REPLAN STRATEGY WITH FEWER JOBS.
            // MAY NEED SOME WAY TO DISPOSE OF JOBS THAT CAN NEVER BE COMPLETED.
            // TODO: Handle this case.
            for (const job of jobs) {
                this.env.failJob(job);
            }
//            throw TypeError();
        }
        else {
            // Execute planned route, one action at a time.
            for (const action of route.actions) {
                if (this.dispatcher.newerPlanAvailable(currentPlanTime)) {
                // if (currentPlanTime < this.dispatcher.getCurrentPlanTime()) {
                    // There's a new plan available. Break out of the loop to
                    // allow caller to merge in new plan.
                    break;
                }
                // TODO: Do we want to check whether unexpected delays have
                // rendered the plan obsolete?
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
        this.env.assignJob(action.job, cart);
        // action.job.assignedTo = cart;

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
