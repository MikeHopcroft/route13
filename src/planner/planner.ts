/* TODO

FEATURE: Splitting large job into multiple smaller jobs.

Combine PlanState with newHead actions list
Pull cart into PlanState (since it is copied as a parameter anyway)
Make PlanState into a class and then add copy method

x Suspend and Resume actions

Unit test for permutations

Difference between plan working time and plan score/value

Score: payload transferred / working time
    What if a large number of bags per minute ignores urgent bags?
    IDEA: perhaps jobs specify urgency levels based on time remaining.
    Want to maximize quantity of urgency transported per unit time.
    Perhaps need to factor distance out of score. Just use distance as a constraint.
        Two jobs that differ only by destination should have equal value
        even if cost is different.
    But the amount of resources consumed is important . . .

Score: payload * time on board / time

payload * time before deadline
    What if 1 bag delivered months early override 40 bags delivered one minute before

x Rethink out-of-service model.
x Permutation table generation and testing.
x Plan enumeration.

Job tuple enumeration.
Priority queue.
Conflicting job elimination.

Simple simulator.

*/

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
    SUSPEND,
    RESUME
}

export interface Action {
    job: AnyJob;
    type: ActionType;
    location: LocationId;
    time: SimTime;
    quantity: number;
}

export interface Plan {
    cart: Cart;
    actions: Action[];
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
            s = `suspend at location ${action.location} before ${action.time}`;
            break;
        case ActionType.RESUME:
            s = `resume from location ${action.location} at ${action.time}`;
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
            console.log('========================')
            this.explainPlan(plan, time);
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

    private *validPlansFromActions(trie: Trie, cart: Cart, previousState: PlanState, actions: (Action | null)[], head: Action[]): IterableIterator<Plan> {
        let leafNode = true;
        // const state = { ...previousState };

        for (const branch of trie) {
            const action = actions[branch.key];
            if (action) {
                leafNode = false;
                const newHead = [...head, action];
                const state = { ...previousState };

                // const logger = (msg: string) => {
                //     console.log(msg);
                // }

                if (!this.applyAction(cart, state, action, NopLogger)) {
                    console.log();
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

    private applyAction(cart: Cart, state: PlanState, action: Action, logger: Logger ): boolean {
        switch (action.type) {
            case ActionType.DROPOFF: {
                logger(`DROPOFF ${action.quantity} bags at gate ${action.location} before ${action.time}`);
                const startTime = state.time;

                const transitTime = this.transitTimeEstimator(state.location, action.location, state.time);
                logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
                state.time += transitTime;
                state.location = action.location;

                const unloadTime = this.unloadTimeEstimator(action.location, action.quantity, state.time);
                logger(`    ${state.time}: unload ${action.quantity} bags in ${unloadTime}s.`);
                state.time += unloadTime;
                state.payload -= action.quantity;

                if (state.time > action.time) {
                    // This plan is invalid because it unloads after the deadline.
                    logger(`    ${state.time}: dropoff after deadline ${action.time}`);
                    return false;
                }

                if (state.payload < 0) {
                    // This should never happen. Log and throw.
                    const message = `Bug: cart ${cart.id} has negative payload.`;
                    throw TypeError(message);
                }

                state.workingTime += (state.time - startTime);

                break;
            }

            case ActionType.PICKUP: {
                logger(`PICKUP ${action.quantity} bags at gate ${action.location} after ${action.time}`);
                const startTime = state.time;

                const transitTime = this.transitTimeEstimator(state.location, action.location, state.time);
                logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
                state.time += transitTime;
                state.location = action.location;

                if (action.time > state.time) {
                    // Wait until load is available for pickup.
                    const waitTime = action.time - state.time;
                    logger(`    ${state.time}: wait ${waitTime}s until ${action.time}`);
                    state.time = action.time;
                }

                const loadTime = this.loadTimeEstimator(action.location, action.quantity, state.time);
                logger(`    ${state.time}: load ${action.quantity} bags in ${loadTime}s.`);
                state.time += loadTime;
                state.payload += action.quantity;

                if (state.payload > cart.capacity) {
                    // This plan is invalid because its payload exceeds cart capacity.
                    logger(`    ${state.time}: pickup capcity ${state.payload} exceeds capacity ${cart.capacity}`);
                    return false;
                }

                state.workingTime += (state.time - startTime);

                break;
            }

            case ActionType.SUSPEND: {
                logger(`SUSPEND at gate ${action.location} before ${action.time}`);
                const transitTime = this.transitTimeEstimator(state.location, action.location, state.time);;
                logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
                state.time += transitTime;
                state.workingTime += transitTime;
                state.location = action.location;

                if (state.time > action.time) {
                    // This plan is invalid because it suspends after the deadline.
                    return false;
                }
                
                logger(`    ${state.time}: suspend operations`);
                
                break;
            }

            case ActionType.RESUME:
                logger(`RESUME from gate ${action.location} at ${action.time}`);
                if (action.time > state.time) {
                    // Wait until it is time to resume.
                    const waitTime = action.time - state.time;
                    logger(`    ${state.time}: wait ${waitTime}s until ${action.time}`);

                    state.time = action.time;
                }

                logger(`    ${state.time}: resume operations`)

                break;

            default:
                // Should never get here. Log and throw.
                const message = `Unknown action type ${action.type}`;
                throw TypeError(message);
        }

        logger(`    ${state.time}: completed`);

        // This plan was not shown to be invalid.
        return true;
    }

    private actionsFromJobs(cart: Cart, jobs: AnyJob[]): (Action | null)[] {
        const actions: (Action | null)[] = [];

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
                            time: job.suspendTime,
                            quantity: 0
                        });
                    }
                    else {
                        actions.push(null);
                    }
                    actions.push({
                        job,
                        type: ActionType.RESUME,
                        location: job.suspendLocation,
                        time: job.resumeTime,
                        quantity: 0
                    });

                    break;

                case JobType.TRANSFER:
                    if (job.state === TransferJobState.BEFORE_PICKUP) {
                        actions.push({
                            job,
                            type: ActionType.PICKUP,
                            location: job.pickupLocation,
                            time: job.pickupAfter,
                            quantity: job.quantity
                        });
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
                    });

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


//     // Determines whether a plan satisfies the following constraints:
//     //   1. Cart capacity is never exceeded.
//     //   2. Dropoffs are before deadlines.
//     // Assumes that plans never specify a job's dropoff before its pickup.
//     // The enumerateAllPlans() generator only generates plans that meet this
//     // criteria.
//     //
//     // NOTE that a plan with score zero may still be valid. An example would be
//     // a plan that consists solely of an out-of-service interval.
//     validateAndScore(plan: Plan, startTime: SimTime): boolean {
//         let time = startTime;
//         let location = plan.cart.lastKnownLocation;
//         let payload = plan.cart.payload;
//         let quantityTransferred = 0;

//         for (const action of plan.actions) {
//             time += this.transitTimeEstimator(location, action.location, time);

//             if (action.type === ActionType.DROPOFF) {
//                 time += this.unloadTimeEstimator(action.location, action.quantity, time);
//                 if (time > action.time) {
//                     // This plan is invalid because it unloads after the deadline.
//                     plan.score = 0;
//                     return false;
//                 }
//                 payload -= action.quantity;
//                 quantityTransferred += action.quantity;

//                 if (payload < 0) {
//                     // This should never happen. Log and throw.
//                     const message = `Cart ${plan.cart.id} has negative payload.`;
//                     throw TypeError(message);
//                 }
//             }
//             else if (action.type === ActionType.PICKUP) {
//                 if (action.time > time) {
//                     // Wait until load is available for pickup.
//                     time = action.time;

//                     time += this.loadTimeEstimator(action.location, action.quantity, time);
//                     payload += action.quantity;

//                     if (payload > plan.cart.capacity) {
//                         // This plan is invalid because its payload exceeds cart capacity.
//                         plan.score = 0;
//                         return false;
//                     }
//                 }
//             }
//             else {
//                 // Should never get here. Log and throw.
//                 const message = `Unknown action type ${action.type}`;
//                 throw TypeError(message);
//             }
//         }

//         // This plan does not violate any constraints.

//         // Score the plan.
//         // This score represents average amount transferred per unit time.
//         // It does not bias towards loads that are closer to their deadlines.
//         // It does not directly consider cart utilization (although this is
//         // correlated with transfer rate).

//         // NOTE: the scoring here is for the quality of the routing, not
//         // the value of the plan itself. Therefore, the criteria should
//         // probably be minimizing elapsed time (or elasped time doing work vs
//         // travelling out of service).
// //        compileError;
//         const elapsedTime = time - startTime;
//         plan.score = quantityTransferred / elapsedTime;

//         return true;
//     }
}

export interface TrieNode {
    key: number;
    children: Trie;
}
export type Trie = Array<TrieNode>;

// let counter = 0;

export function buildTrie(head: number[], tail: number[]): Trie {
    const children: Trie = [];

    // if (tail.length === 0) {
    //     console.log(`${counter++}: ${head.join('')}`);
    // }

    for (const [index, key] of tail.entries()) {
        if (key % 2 == 0 || head.includes(key - 1)) {
            const newHead = [...head, key];
            const newTail = tail.filter(x => x !== key);
            // console.log(`${counter++}: ${newHead.join('')}`);
            children.push({
                key,
                children: buildTrie(newHead, newTail)
            });
        }
    }
    return children;
}

function walkTrie(trie: Trie, actions: (string|null)[], head: string[]) {
    let leafNode = true;

    for (const branch of trie) {
        const action = actions[branch.key];
        if (action) {
            leafNode = false;
            const newHead = [...head, action];
            walkTrie(branch.children, actions, newHead);
        }
    }

    if (leafNode) {
        console.log(head.join(''));
    }
}

// const trie = buildTrie([], [0, 1, 2, 3]);          // 89 permutations of three start-end pairs
// walkTrie(trie, ['a', null, 'c', 'd', null, null], []);

// buildTrie([], [0, 1, 2, 3]);
// walkTrie(trie, ['a', null, 'c', 'd', 'e', 'f'], []);
// buildTrie([], [0, 1, 2, 3, 4, 5, 6, 7]); // 2520 permutations of four start-end pairs.

// CASE: planner can only look ahead 3 jobs, but there are 4 jobs that could all
// be picked up at one location.


/*
Proposed algorithm

for each cart
    for each {a,b,c,..} subset of jobs
        create plan(cart, [a,b,c])
            for each permutation of destinations
                exclude if capacity is exceeded
                exclude if deadlines not fulfilled
                find best scoring plan
        add plan to priority queue
        add plan to each job => plan list mapping

// Greedy assign boulders
while (some criteria)    // more carts to assign, value of remaining plans adequate
    pull first plan from priority queue
    assign plan to cart
        this involves marking plamn's jobs as assigned
        marking plan itself as assigned
        removing all conflicting plans from consideration

// Backfill with sand
// Either pick carts and assign most valuable add-on job
// or pick jobs and find best cart to assign
for each assigned plan in order of decreasing elapsed time

*/


// 
// DESIGN NOTES
/*
Need some way to constrain new plan proposals to satisfy in-progress plan elements.
For example, if a plan involves jobs a, b, and c, and job a has already been picked
up, new plans should contain job a.

Need some way to constrain new plan proposals to satisfy constraints like planned
out-of-service times.

Need some way to track progress of jobs.
    Before origin
    Between origin and destination
    Complete
*/




/*
// On modeling out-of-service time

// Each cart has an in-service interval and an out-of-service location.
// Jobs can be specified during the in-service interval.
// Legal assignments must allow transit time to out-of-service location.
// */
// const outOfService: Job = {
//     id: 1234,

//     state: TransferJobState.ENROUTE,
//     assignedTo: 123,

//     quantity: 0,

//     pickupLocation: NO_LOCATION,
//     pickupAfter: MIN_SIM_TIME,

//     dropoffLocation: BREAK_ROOM,
//     dropoffBefore: 17 * HOURS
// }

// const enteringService: Job = {
//     id: 1235,

//     state: TransferJobState.ENROUTE,
//     assignedTo: 123,

//     quantity: 0,

//     pickupLocation: NO_LOCATION,
//     pickupAfter: MIN_SIM_TIME,

//     dropoffLocation: BREAK_ROOM,
//     dropoffBefore: 17 * HOURS
// }
