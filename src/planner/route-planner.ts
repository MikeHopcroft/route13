import { buildTrie, Trie } from './trie';
import { Cart, LocationId, SimTime } from '../types';
import { AnyJob, JobType, OutOfServiceJobState, TransferJobState } from '../types';
import { Action, ActionType, AnyAction, Plan, SuspendAction, TransferAction } from '../types';
import { LoadTimeEstimator, TransitTimeEstimator, UnloadTimeEstimator } from '../types';

interface PlanState {
    time: SimTime;
    location: LocationId;
    payload: number;
    workingTime: SimTime;
}

export type Logger = (message: string) => void;

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
