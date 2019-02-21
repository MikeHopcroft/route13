import { ActionType, AnyAction, DropoffAction, PickupAction, SuspendAction } from '../types'
import { AnyJob, Cart, LocationId, SimTime } from '../types';
import { Clock } from './clock';
import { Dispatcher } from './dispatcher';
import { Environment } from './environment';

class Agent {
    private clock: Clock;
    dispatcher: Dispatcher;
    private env: Environment;

    constructor(clock: Clock, dispatcher: Dispatcher, env: Environment) {
        this.clock = clock;
        this.dispatcher = dispatcher;
        this.env = env;
    }

    // Simple agent processes one job at a time.
    // When finished, grabs next unassigned job in FIFO order.
    *agent(cart: Cart) {
        while (true) {
            // Wait for a job to become available.
            yield this.dispatcher.waitForJob();

            // Select a job, FIFO order.
            const job = this.env.unassignedJobs.shift() as AnyJob;
            this.env.assignedJobs.add(job);

            // Convert job to a plan.
            const plan = this.env.routePlanner.getBestRoute(cart, [job], this.clock.time);

            // Execute plan.
            if (plan) {
                this.actionSequence(cart, plan.actions);
                this.env.assignedJobs.delete(job);
                this.env.successfulJobs.push(job);
            }
            else {
                // There is no plan that can complete this job.
                this.env.assignedJobs.delete(job);
                this.env.failedJobs.push(job);
            }
        }
    }

    private *actionSequence(cart: Cart, actions: AnyAction[]) {
        for (const action of actions) {
            // TODO: before each action, check to see if there is a new action sequence.
            yield* this.action(cart, action);
        }
    }

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

    private *pickup(cart: Cart, action: PickupAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(action.time);
        yield* this.load(cart, action.quantity);
    }

    private *dropoff(cart: Cart, action: DropoffAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(action.time);
        yield* this.unload(cart, action.quantity);
    }

    private *suspend(cart: Cart, action: SuspendAction) {
        yield* this.driveTo(cart, action.location);
        yield* this.waitUntil(action.resumeTime);
    }

    private *driveTo(cart: Cart, destination: LocationId) {
        while (cart.lastKnownLocation !== destination) {
            const next = this.env.routeNextStep(cart.lastKnownLocation, destination, this.clock.time);
            const driveTime = this.env.transitTimeEstimator(cart.lastKnownLocation, next, this.clock.time);
            yield this.clock.until(this.clock.time + driveTime);
            cart.lastKnownLocation = next;
        }
    }

    private *load(cart: Cart, quantity: number) {
        if (cart.payload + quantity > cart.capacity) {
            const message = `cart ${cart.id} with ${cart.payload} will exceed capacity loading ${quantity} items.`
            throw TypeError(message);
        }
        const loadingFinishedTime = this.clock.time + this.env.loadTimeEstimator(cart.lastKnownLocation, quantity, this.clock.time);
        yield this.clock.until(loadingFinishedTime);
        cart.payload += quantity;
    }

    private *unload(cart: Cart, quantity: number) {
        if (cart.payload < quantity) {
            const message = `cart ${cart.id} with ${cart.payload} does not have ${quantity} items to unload.`
            throw TypeError(message);
        }
        const unloadingFinishedTime = this.clock.time + this.env.unloadTimeEstimator(cart.lastKnownLocation, quantity, this.clock.time);
        yield this.clock.until(unloadingFinishedTime);
        cart.payload -= quantity;
    }

    private *waitUntil(resumeTime: SimTime) {
        if (this.clock.time < resumeTime) {
            yield this.clock.until(resumeTime);
        }
    }
}
