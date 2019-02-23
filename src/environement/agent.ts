import { ActionType, AnyAction, DropoffAction, PickupAction, SuspendAction, TransferJobState, OutOfServiceJobState } from '../types'
import { AnyJob, Cart, LocationId, SimTime } from '../types';
import { Clock } from './clock';
import { Continuation } from './continuation';
import { Dispatcher } from './dispatcher';
import { Environment } from './environment';
import { Trace } from './trace';

// The Agent orchestrates the sequences of Actions to complete a set of Jobs.
export class Agent {
    private clock: Clock;
    private dispatcher: Dispatcher;
    private env: Environment;
    private trace: Trace | undefined;

    constructor(clock: Clock, dispatcher: Dispatcher, env: Environment, trace: Trace | undefined) {
        this.clock = clock;
        this.dispatcher = dispatcher;
        this.env = env;
        this.trace = trace;
    }

    // Worker/Continuation that operates a single cart.
    // Processes one job at a time. When finished, grabs next unassigned Job
    // from the Dispatcher.
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
                yield* this.actionSequence(cart, plan.actions);
            }
            else {
                // There is no plan for this cart to complete this job.
                this.env.failJob(job);
            }
        }
    }

    // Worker/Continuation to execute a sequence of Actions.
    private *actionSequence(cart: Cart, actions: AnyAction[]) {
        for (const action of actions) {
            // TODO: before each action, check to see if there is a new action sequence.
            yield* this.action(cart, action);
        }
    }

    // Worker/Continuation to execute a single Action.
    private *action(cart: Cart, action: AnyAction) {
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

    // Worker/Continuation that picks up a load.
    private *pickup(cart: Cart, action: PickupAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(cart, action.time);
        action.job.state = TransferJobState.ENROUTE;
        yield* this.load(cart, action.quantity);
    }

    // Worker/Continuation that drops off a load.
    private *dropoff(cart: Cart, action: DropoffAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.unload(cart, action.quantity);
        this.env.completeJob(action.job);
    }

    // Worker/Continuation that takes a cart out of service.
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

    // Worker/Continuation that drive a cart to a specified destination.
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

    // Worker/Continuation that loads items.
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

    // Worker/Continuation that unloads items.
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

    // Worker/Continuation that waits until a specified time.
    private *waitUntil(cart: Cart, resumeTime: SimTime) {
        if (this.clock.time < resumeTime) {
            if (this.trace) {
                this.trace.cartWaits(cart, resumeTime);
            }
            yield this.clock.until(resumeTime);
        }
    }
}
