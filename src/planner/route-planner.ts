import { SimTime } from '../core';
import { Cart, Job, JobType, LocationId, OutOfServiceJobState, TransferJobState } from '../environement';
import { LoadTimeEstimator, TransitTimeEstimator, UnloadTimeEstimator } from '../estimators';
import { Action, ActionBase, ActionType, DropoffAction, PickupAction, Plan, SuspendAction } from '../planner';

import { buildTrie, Trie } from './trie';

interface PlanState {
    readonly startTime: SimTime;
    time: SimTime;
    location: LocationId;
    payload: number;
    workingTime: SimTime;
}

function stateFromCart(cart: Cart, time: SimTime): PlanState {
    return {
        startTime: time,
        time,
        location: cart.lastKnownLocation,
        payload: cart.payload,
        workingTime: 0
    }
}

export type Logger = (message: string) => void;


///////////////////////////////////////////////////////////////////////////////
//
// RoutePlanner
//
///////////////////////////////////////////////////////////////////////////////

// RoutePlanner finds the optimal order of pickups and dropoffs, given a
// starting location and a set of Jobs. The planning algorithm uses a brute
// force enumeration of every possible route. Routes that don't meet delivery
// deadline constraints and cart capacity constraints are excluded from
// consideration. The algorithm selects the route with the shortest elaspsed
// time.
export class RoutePlanner {
    // Maximum number of Jobs to plan for. Used to size a trie.
    private readonly maxJobs: number;

    // Caller-provided functions that estimates the times to load/unload a
    // certain number of items and travel between two specified locations.
    private readonly loadTimeEstimator: LoadTimeEstimator;
    private readonly unloadTimeEstimator: UnloadTimeEstimator;
    private readonly transitTimeEstimator: TransitTimeEstimator;

    private readonly logger: Logger | null;

    // TODO: REVIEW: would rather not have this one piece of mutable state as a
    // member. This makes the class more of a state machine.
    private failedPlanCount: number;

    // Each job can specify up to two Actions with an ordering constraint.
    // The planner only considers plans where the first Action runs before
    // the second Action. As an example, a TransferJob consists of a
    // PickupAction and a DropoffAction. The PickupAction must be run before
    // the DropOffAction, but Actions from other jobs can run between.
    //
    // A plan is a sequence of Actions. The paths through `permutations` trie
    // represent the permutations of Actions that maintain the ordering
    // constraints. The permutations are represented as sequences of positions
    // in the plan's Action array.
    //
    // For example, consider a plan with two transfer jobs, one from A to B
    // and the other from C to D. The Action array might consist of
    //    pickup from A
    //    dropoff at B
    //    pickup from C
    //    dropoff at D
    // The set of index permutations where A comes before B and C comes
    // before D is
    //    [0, 1, 2, 3]
    //    [0, 2, 1, 3]
    //    [0, 2, 3, 1]
    //    [2, 0, 1, 3]
    //    [2, 0, 3, 1]
    //    [2, 3, 0, 1]
    // Note there are only 6 permutations that satisfy the constraint that
    // pickups appear before correspondign dropoffs. This is significantly
    // less than the 24 possible permutations of 4 actions.
    private permutations: Trie;

    constructor(
        maxJobs: number,
        loadTimeEstimator: LoadTimeEstimator,
        unloadTimeEstimator: UnloadTimeEstimator,
        transitTimeEstimator: TransitTimeEstimator,
        logger: Logger | null = null
    ) {
        this.maxJobs = maxJobs;
        this.loadTimeEstimator = loadTimeEstimator;
        this.unloadTimeEstimator = unloadTimeEstimator;
        this.transitTimeEstimator = transitTimeEstimator;
        this.logger= logger;

        this.failedPlanCount = 0;

        // Initialize trie of legal action permutations.
        this.permutations = buildTrie([], [...Array(maxJobs * 2).keys()]);
    }

    // Finds the shortest duration plan for a set of jobs, while satisfying
    // the following constraints:
    //    1. The first Action associated with each Job must appear before its
    //       corresponding second Action.
    //    2. The cart capacity is never exceeded.
    //    3. Pickups happen after loads become available.
    //    4. Dropoffs happen before deadlines.
    //
    // cart
    //   The cart that will perform this job. Cart specifies its capacity along
    //   with for initial location and payload.
    // jobs
    //   An array of jobs the cart should perform. The number of jobs should
    //   not exceed the `maxJobs` limit provided to the constructor.
    // time
    //   The time at which the plan should start. This value is passed to the
    //   estimator functions. This allows the estimator functions to model
    //   effects like rush hour conjestion.
    //
    // Returns the Plan with the shortest working time that satisfies the
    // constraints. Workiong time is defined as time that the cart is moving
    // between locations, waiting to load, loading, and unloading. It does
    // not include time when the cart is out of service.
    //
    // Returns null if no Plan satisfies the constraints.
    getBestRoute(cart: Cart, jobs: Job[], time: SimTime): Plan | null {
        let workingTime = Infinity;
        let bestPlan: Plan | null = null;
        let successfulPlanCount = 0;
        this.failedPlanCount = 0;

        for (const plan of this.validPlansFromJobs(cart, jobs, time)) {
            if (plan.score < workingTime) {
                ++successfulPlanCount;
                workingTime = plan.score;
                bestPlan = plan;
            }
        }
        if (this.logger) {
            this.logger('');
            this.logger(`Considered ${this.failedPlanCount} failed plans.`)
            this.logger(`Considered ${successfulPlanCount} successful plans.`)
        }

        return bestPlan;
    }

    // Enumerate all valid plans for a set of Jobs.
    private *validPlansFromJobs(cart: Cart, jobs: Job[], time: SimTime): IterableIterator<Plan> {
        if (jobs.length > this.maxJobs) {
            const message = `Too many jobs for cart ${cart.id}`;
            throw TypeError(message);
        }

        // Form array of actions associated with these jobs.
        const actions = this.actionsFromJobs(jobs);

        const state = stateFromCart(cart, time);
        yield* this.validPlansFromActions(this.permutations, cart, state, actions, []);
    }

    // Enumerate all value plans from a set of Actions.
    private *validPlansFromActions(trie: Trie, cart: Cart, previousState: PlanState, actions: (Action | null)[], head: Action[]): IterableIterator<Plan> {
        let leafNode = true;

        for (const branch of trie) {
            const action = actions[branch.key];
            if (action) {
                leafNode = false;
                const newHead = [...head, action];
                const state = { ...previousState };

                if (!this.applyAction(cart.capacity, state, action)) {
                    ++this.failedPlanCount;
                    if (this.logger) {
                        this.logger('=================');
                        this.logger('Failed:');
                        this.logger('')
                        const plan = { cart, actions: newHead, score: state.workingTime };
                        this.explainPlan(plan, state.startTime, this.logger);
                        this.logger('')
                    }

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

    // Simulate running a single Action.
    //
    // capacity
    //   the capacity of the cart that will execute the plan.
    // state
    //   the state of the simulation at the start of the plan.
    // action
    //   the action to run
    // logger
    //   an optional logger to display or record simulation progress.
    //
    // Returns true if the run doesn't violate constraints.
    // In this case, `state` will reflect the state after running the action.
    // Otherwise returns false. At this point, `state` should be considered
    // invalid.
    //
    // DESIGN NOTE: this planning code is coupled with the Environment
    // simulation code because it assumes a specific ordering of steps in each
    // action. The planner will lose its effectiveness as the planning code
    // diverges from the environment code.
    //
    // Unfortunately, it may not be feasible to share code because the
    // Environment simulator may use an entirely different approach (e.g. play
    // back a log or fuzz tasks with random errors).
    private applyAction(capacity: number, state: PlanState, action: Action, logger: Logger | null = null ): boolean {
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
                        logger(`    ${state.time}: CONTRAINT VIOLATED - dropoff after deadline ${action.time}`);
                    }
                    return false;
                }

                if (state.payload < 0) {
                    // TODO: for resiliance, perhaps this should log and return
                    // false instead of throwing?
                    // This should never happen. Log and throw.
                    const message = `Bug: cart has negative payload.`;
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

                if (state.payload > capacity) {
                    // This plan is invalid because its payload exceeds cart capacity.
                    if (logger) {
                        logger(`    ${state.time}: CONTRAINT VIOLATED - payload of ${state.payload} exceeds capacity of ${capacity}`);
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
                        logger(`    ${state.time}: CONTRAINT VIOLATED - suspends after deadline ${action.suspendTime}`);
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
                const message = `Unknown action type ${(action as ActionBase).type}`;
                throw TypeError(message);
        }

        if (logger) {
            logger(`    ${state.time}: completed`);
        }

        // This plan was not shown to be invalid.
        return true;
    }

    // Generate a sequence of Actions necessary to perform a set of Jobs.
    // In the sequence, each even-odd position pair is associated with a
    // single Job. The even position should contain the first Action for
    // a Job. The odd position should contain the second Action, or null,
    // if the Job has only one Action.
    //
    // jobs
    //   The set of jobs
    //
    // Returns an array of Actions associated with the jobs.
    private actionsFromJobs(jobs: Job[]): (Action | null)[] {
        const actions: (Action | null)[] = [];

        for (const job of jobs) {
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

                        // The OutOfServiceJob doesn't have a second Action.
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
                        } as PickupAction);
                    }
                    else {
                        // We've already picked up, so first Action slot is null.
                        actions.push(null);
                    }

                    actions.push({
                        job,
                        type: ActionType.DROPOFF,
                        location: job.dropoffLocation,
                        time: job.dropoffBefore,
                        quantity: job.quantity
                    } as DropoffAction);

                    break;

                default:
                    ;
            }
        }
        return actions;
    }

    // Debugging function gives running commentary on a simulated run of a Plan.
    // 
    // plan
    //   the Plan to explain
    // time
    //   the time to start the Plan.
    explainPlan(plan: Plan, time: SimTime, logger: Logger) {
        console.log(`Plan for cart ${plan.cart.id} (working time = ${plan.score}):`);
    
        const cart = plan.cart;
        const state = stateFromCart(cart, time);

        for (const action of plan.actions) {
            if (!this.applyAction(cart.capacity, state, action, logger)) {
                break;
            }
        }
    }
}

// Debugging function that converts and Action to a human-readable string.
export function formatAction(action: Action): string {
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
        default:
            break;
    }
    return s;
}

// Debuggin function. Prints a description to a Plan to the console.
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
