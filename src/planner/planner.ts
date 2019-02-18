import { buildTrie, Trie, TrieNode } from './trie';

//
// Constants
//

export const MINUTES = 60;             // Seconds per minute.
export const HOURS = MINUTES * 60;     // Seconds per hour.




export type LocationId = number;

export type SimTime = number;

///////////////////////////////////////////////////////////////////////////////
//
// Carts
//
///////////////////////////////////////////////////////////////////////////////

export type CartId = number;

export interface Cart {
    id: CartId;

    // Cart capacity could be number of boxes/containers, tons, gallons, etc.
    capacity: number;

    // Amount of capacity currenty in use.
    payload: number;
    lastKnownLocation: LocationId;

    // DESIGN NOTE: information about jobs currently assigned to a cart is
    // encoded in the Job data structure. Don't want to duplicate this
    // information here to avoid inconsistencies.
    // ISSUE: Cart payload could still be inconsistent with current jobs.
    // We could infer the payload from the jobs. Not sure where this
    // information should reside. There is an argument for not storing the
    // payload quantity with the cart, and that is that we don't anticipate
    // a way to measure this quantity.
    //
    // Could measure the location with GPS tracker.
    // Could measure the payload with RFID, or on/off scans.
}


///////////////////////////////////////////////////////////////////////////////
//
// Jobs
//
///////////////////////////////////////////////////////////////////////////////

export type JobId = number;

export enum JobType {
    OUT_OF_SERVICE,
    TRANSFER
}

export interface Job {
    id: JobId;
    type: JobType;

    assignedTo: CartId | null;
}

// The OutOfServiceJob is mandatory and the scheduler treats it as a
// constraint. A valid plan must incorporate sufficient transit time
// to reach the suspendLocation before the suspendTime. Subsequent
// will not be processed until the resumeTime.
//
// DESIGN NOTE: Modeling out-of-service as a job, instead of a cart
// characteristic in order to easily model brief out-of-service periods like
// refueling. We want the planner to be able to anticipate carts resuming
// service.

export enum OutOfServiceJobState {
    BEFORE_BREAK,
    ON_BREAK
}

export interface OutOfServiceJob extends Job {
    type: JobType.OUT_OF_SERVICE;

    state: OutOfServiceJobState;

    suspendLocation: LocationId;
    suspendTime: SimTime;
    resumeTime: SimTime;
}

export enum TransferJobState {
    BEFORE_PICKUP,
    ENROUTE
}

// A valid plan must satisfy the following conditions:
//   1. Pickup not before pickupAfter time.
//   2. Sufficient time to load, travel to dropoffLocation, and unload before
//      dropoffBefore time.
//   3. Cart capacity not exceeded.
export interface TransferJob extends Job {
    type: JobType.TRANSFER;

    state: TransferJobState;

    quantity: number;

    // ISSUE: should we specify intervals for pickup and dropoff?
    pickupLocation: LocationId;
    pickupAfter: SimTime;

    dropoffLocation: LocationId;
    dropoffBefore: SimTime;
}

export type AnyJob = OutOfServiceJob | TransferJob;

///////////////////////////////////////////////////////////////////////////////
//
// Plans and Actions
//
///////////////////////////////////////////////////////////////////////////////

export enum ActionType {
    PICKUP,
    DROPOFF,
    SUSPEND
}

export interface Action {
    job: AnyJob;
    type: ActionType;
}

export interface TransferAction extends Action {
    job: TransferJob;
    type: ActionType.DROPOFF | ActionType.PICKUP;
    location: LocationId;
    time: SimTime;
    quantity: number;
}

export interface SuspendAction extends Action {
    job: OutOfServiceJob;
    type: ActionType.SUSPEND;
    location: LocationId;
    suspendTime: SimTime;
    resumeTime: SimTime;
}

export type AnyAction = TransferAction | SuspendAction;

export interface Plan {
    cart: Cart;
    actions: AnyAction[];
    score: number;
}

interface PlanState {
    time: SimTime;
    location: LocationId;
    payload: number;
    workingTime: SimTime;
}

export type Logger = (message: string) => void;

export function NopLogger(message: string) {
    // This logger does nothing.
}

export function formatAction(action: AnyAction): string {
    let s = "Unknown action";
    switch (action.type) {
        case ActionType.DROPOFF:
            s = `dropoff ${action.quantity} bags at gate ${action.location} before ${action.time}`;
            break;
        case ActionType.PICKUP:
            s = `pickup ${action.quantity} bags at gate ${action.location} after ${action.time}`;
            break;
        case ActionType.SUSPEND:
            s = `suspend at location ${action.location} before ${action.suspendTime} until ${action.resumeTime}`;
            break;
        // case ActionType.RESUME:
        //     s = `resume from location ${action.location} at ${action.time}`;
        //     break;
        default:
            break;
    }
    return s;
}

export function printPlan(plan: Plan, time: SimTime) {
    console.log(`Plan for cart ${plan.cart.id} (working time = ${plan.score}):`);

    const cart = plan.cart;
    const state = {
        time,
        location: cart.lastKnownLocation,
        payload: cart.payload,
        workingTime: 0
    }

    for (const action of plan.actions) {
        console.log(`  ${formatAction(action)}`);
    }

}

///////////////////////////////////////////////////////////////////////////////
//
// RoutePlanner
//
///////////////////////////////////////////////////////////////////////////////

// Returns the estimated time to travel from origin to destination, starting
// at startTime. Implementations could use a static table of historical travel
// times, or a more complex model that considers factors like current and
// anticipated congestion.
export type TransitTimeEstimator = (origin: LocationId, destination: LocationId, startTime: SimTime) => SimTime;
export type LoadTimeEstimator = (location: LocationId, quantity: number, startTime: SimTime) => SimTime;
export type UnloadTimeEstimator = (location: LocationId, quantity: number, startTime: SimTime) => SimTime;

export class RoutePlanner {
    maxJobs: number;
    loadTimeEstimator: LoadTimeEstimator;
    unloadTimeEstimator: UnloadTimeEstimator;
    transitTimeEstimator: TransitTimeEstimator;

    permutations: Trie;

    constructor(
        maxJobs: number,
        loadTimeEstimator: LoadTimeEstimator,
        unloadTimeEstimator: UnloadTimeEstimator,
        transitTimeEstimator: TransitTimeEstimator
    ) {
        this.maxJobs = maxJobs;
        this.loadTimeEstimator = loadTimeEstimator;
        this.unloadTimeEstimator = unloadTimeEstimator;
        this.transitTimeEstimator = transitTimeEstimator;

        // Initialize trie of legal action permutations.
        this.permutations = buildTrie([], [...Array(maxJobs * 2).keys()]);
    }

    // Gets the highest scoring plan for a set of jobs.
    getBestRoute(cart: Cart, jobs: AnyJob[], time: SimTime): Plan | null {
        let workingTime = Infinity;
        let bestPlan: Plan | null = null;

        for (const plan of this.validPlansFromJobs(cart, jobs, time)) {
            // console.log('========================')
            // this.explainPlan(plan, time);
            if (plan.score < workingTime) {
                workingTime = plan.score;
                bestPlan = plan;
            }
        }

        return bestPlan;
    }

    private *validPlansFromJobs(cart: Cart, jobs: AnyJob[], time: SimTime): IterableIterator<Plan> {
        if (jobs.length > this.maxJobs) {
            const message = `Too many jobs for cart ${cart.id}`;
            throw TypeError(message);
        }

        // Form array of actions associated with these jobs.
        const actions = this.actionsFromJobs(cart, jobs);

        const state = {
            time,
            location: cart.lastKnownLocation,
            payload: cart.payload,
            workingTime: 0
        }
        yield* this.validPlansFromActions(this.permutations, cart, state, actions, []);
    }

    private *validPlansFromActions(trie: Trie, cart: Cart, previousState: PlanState, actions: (AnyAction | null)[], head: AnyAction[]): IterableIterator<Plan> {
        let leafNode = true;

        for (const branch of trie) {
            const action = actions[branch.key];
            if (action) {
                leafNode = false;
                const newHead = [...head, action];
                const state = { ...previousState };

                if (!this.applyAction(cart, state, action)) {
                    console.log('=================');
                    console.log('Failed:');
                    const plan = { cart, actions: newHead, score: state.workingTime };
                    this.explainPlan(plan, previousState.time);
                    console.log();

                    return;
                }

                yield* this.validPlansFromActions(branch.children, cart, state, actions, newHead);
            }
        }
    
        if (leafNode) {
            // TODO: score and working time are different concepts
            yield { cart, actions: head, score: previousState.workingTime };
        }   
    }

    private applyAction(cart: Cart, state: PlanState, action: AnyAction, logger: Logger | null = null ): boolean {
        switch (action.type) {
            case ActionType.DROPOFF: {
                if (logger) {
                    logger(`DROPOFF ${action.quantity} bags at gate ${action.location} before ${action.time} (job ${action.job.id})`);
                }
                const startTime = state.time;

                if (action.location !== state.location) {
                    const transitTime = this.transitTimeEstimator(state.location, action.location, state.time);
                    if (logger) {
                        logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
                    }
                    state.time += transitTime;
                    state.location = action.location;
                }

                const unloadTime = this.unloadTimeEstimator(action.location, action.quantity, state.time);
                if (logger) {
                    logger(`    ${state.time}: unload ${action.quantity} bags in ${unloadTime}s.`);
                }
                state.time += unloadTime;
                state.payload -= action.quantity;

                if (state.time > action.time) {
                    // This plan is invalid because it unloads after the deadline.
                    if (logger) {
                        logger(`    ${state.time}: dropoff after deadline ${action.time}`);
                    }
                    return false;
                }

                if (state.payload < 0) {
                    // TODO: for resiliance, perhaps this should log and return
                    // false instead of throwing?
                    // This should never happen. Log and throw.
                    const message = `Bug: cart ${cart.id} has negative payload.`;
                    throw TypeError(message);
                }

                state.workingTime += (state.time - startTime);

                break;
            }

            case ActionType.PICKUP: {
                if (logger) {
                    logger(`PICKUP ${action.quantity} bags at gate ${action.location} after ${action.time} (job ${action.job.id})`);
                }
                const startTime = state.time;

                if (action.location !== state.location) {
                    const transitTime = this.transitTimeEstimator(state.location, action.location, state.time);
                    if (logger) {
                        logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
                    }
                    state.time += transitTime;
                    state.location = action.location;
                }

                if (action.time > state.time) {
                    // Wait until load is available for pickup.
                    const waitTime = action.time - state.time;
                    if (logger) {
                        logger(`    ${state.time}: wait ${waitTime}s until ${action.time}`);
                    }
                    state.time = action.time;
                }

                const loadTime = this.loadTimeEstimator(action.location, action.quantity, state.time);
                if (logger) {
                    logger(`    ${state.time}: load ${action.quantity} bags in ${loadTime}s.`);
                }
                state.time += loadTime;
                state.payload += action.quantity;

                if (state.payload > cart.capacity) {
                    // This plan is invalid because its payload exceeds cart capacity.
                    if (logger) {
                        logger(`    ${state.time}: payload of ${state.payload} exceeds capacity of ${cart.capacity}`);
                    }
                    return false;
                }

                state.workingTime += (state.time - startTime);

                break;
            }

            case ActionType.SUSPEND: {
                if (logger) {
                    logger(`SUSPEND at gate ${action.location} before ${action.suspendTime} until ${action.resumeTime} (job ${action.job.id})`);
                }

                if (action.location !== state.location) {
                    const transitTime = this.transitTimeEstimator(state.location, action.location, state.time);;
                    if (logger) {
                        logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
                    }
                    state.time += transitTime;
                    state.workingTime += transitTime;
                    state.location = action.location;
                }

                if (state.time > action.suspendTime) {
                    // This plan is invalid because it suspends after the deadline.
                    if (logger) {
                        logger(`    ${state.time}: suspends after deadline ${action.suspendTime}`);
                    }
                    return false;
                }

                if (logger) {
                    logger(`    ${state.time}: suspend operations`);
                }

                if (state.time < action.resumeTime) {
                    // Wait until it is time to resume.
                    const waitTime = action.resumeTime - state.time;
                    if (logger) {
                        logger(`    ${state.time}: wait ${waitTime}s until ${action.resumeTime}`);
                    }
                    state.time = action.resumeTime;                    
                }

                if (logger) {
                    logger(`    ${state.time}: resume operations`);
                }
                
                break;
            }

            default:
                // TODO: for resiliance, perhaps this should log and return
                // false instead of throwing?
                // Should never get here. Log and throw.
                const message = `Unknown action type ${(action as Action).type}`;
                throw TypeError(message);
        }

        if (logger) {
            logger(`    ${state.time}: completed`);
        }

        // This plan was not shown to be invalid.
        return true;
    }

    private actionsFromJobs(cart: Cart, jobs: AnyJob[]): (AnyAction | null)[] {
        const actions: (AnyAction | null)[] = [];

        for (const job of jobs) {
            if (job.assignedTo && job.assignedTo !== cart.id) {
                const message = `Job ${job.id} not assigned to cart ${cart.id}.`;
                throw TypeError(message);
            }

            switch (job.type) {
                case JobType.OUT_OF_SERVICE:
                    if (job.state === OutOfServiceJobState.BEFORE_BREAK) {
                        actions.push({
                            job,
                            type: ActionType.SUSPEND,
                            location: job.suspendLocation,
                            suspendTime: job.suspendTime,
                            resumeTime: job.resumeTime
                        } as SuspendAction);

                        actions.push(null);
                    }

                    break;

                case JobType.TRANSFER:
                    if (job.state === TransferJobState.BEFORE_PICKUP) {
                        actions.push({
                            job,
                            type: ActionType.PICKUP,
                            location: job.pickupLocation,
                            time: job.pickupAfter,
                            quantity: job.quantity
                        } as TransferAction);
                    }
                    else {
                        actions.push(null);
                    }

                    actions.push({
                        job,
                        type: ActionType.DROPOFF,
                        location: job.dropoffLocation,
                        time: job.dropoffBefore,
                        quantity: job.quantity
                    } as TransferAction);

                    break;

                default:
                    ;
            }
        }
        return actions;
    }

    explainPlan(plan: Plan, time: SimTime) {
        console.log(`Plan for cart ${plan.cart.id} (working time = ${plan.score}):`);
    
        const cart = plan.cart;
        const state = {
            time,
            location: cart.lastKnownLocation,
            payload: cart.payload,
            workingTime: 0
        }
        const logger = (msg: string) => {
            console.log(msg);
        }

        for (const action of plan.actions) {
            this.applyAction(cart, state, action, logger);
        }
    }
}
