import { Clock, Continuation } from '../core';
import { Dispatcher } from './dispatcher';
import {
    AnyJob,
    Cart,
    Environment,
    OutOfServiceJobState,
    Trace,
    TransferJobState
} from '../environement';
import {
    ActionType,
    AnyAction,
    DropoffAction,
    LocationId,
    PickupAction,
    SimTime,
    SuspendAction
} from '../types';


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

    // Continuation that continuosly operates a single cart.
    // Current implementation processes one job at a time.
    // When finished, grabs next unassigned Job from the Dispatcher.
    *drive(cart: Cart): Continuation {
        while (true) {
            // Wait for a job to become available.
            yield this.dispatcher.waitForJob();

            // Select a job, FIFO order.
            const job = this.env.unassignedJobs.shift() as AnyJob;
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

    // Continuation that performs a sequence of Actions.
    private *performActionSequence(cart: Cart, actions: AnyAction[]) {
        for (const action of actions) {
            // TODO: before each action, check to see if there is a new action sequence.
            yield* this.performOneAction(cart, action);
        }
    }

    // Continuation that performs a single Action.
    private *performOneAction(cart: Cart, action: AnyAction) {
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
                const message = `Unknown action type ${(action as AnyAction).type}`;
                throw TypeError(message);
        }
    }

    // Continuation that picks up a load from a location.
    private *pickup(cart: Cart, action: PickupAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(cart, action.time);
        action.job.state = TransferJobState.ENROUTE;
        yield* this.load(cart, action.quantity);
    }

    // Continuation that drops a load off at a location.
    private *dropoff(cart: Cart, action: DropoffAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.unload(cart, action.quantity);
        this.env.completeJob(action.job);
    }

    // Continuation that takes a cart out of service for a period of time.
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

    // Continuation that drives a cart to a specified destination.
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

    // Continuation that loads items onto a cart.
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

    // Continuation that unloads items from a cart.
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

    // Continuation that waits until a specified time.
    private *waitUntil(cart: Cart, resumeTime: SimTime) {
        if (this.clock.time < resumeTime) {
            if (this.trace) {
                this.trace.cartWaits(cart, resumeTime);
            }
            yield this.clock.until(resumeTime);
        }
    }
}
