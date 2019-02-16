import { create } from "domain";
import { triggerAsyncId } from "async_hooks";

/* TODO

Rethink out-of-service model.
Permutation table generation and testing.
Plan enumeration.

Job tuple enumeration.
Priority queue.
Conflicting job elimination.

Simple simulator.

*/

//
// Constants
//

const MINUTES = 60;             // Seconds per minute.
const HOURS = MINUTES * 60;     // Seconds per hour.




type LocationId = number;
// const NO_LOCATION: LocationId = 0;
// const BREAK_ROOM: LocationId = 1;

type SimTime = number;
// const MIN_SIM_TIME: SimTime = 0;

///////////////////////////////////////////////////////////////////////////////
//
// Carts
//
///////////////////////////////////////////////////////////////////////////////

type CartId = number;

interface Cart {
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

type JobId = number;

enum JobType {
    OUT_OF_SERVICE,
    TRANSFER
}

interface Job {
    id: JobId;
    type: JobType;

    assignedTo: CartId | null;
}

// The OutOfServiceJob is mandatory and the scheduler treats it as a
// constraint. A valid plan must incorporate sufficient transit time
// to reach the suspendLocation before the suspendTime. Subsequent
// will not be processed until the resumeTime.
//
// DESIGN NOTE: Modelling out-of-service as a job, instead of a cart
// characteristic in order to easily model brief out-of-service periods like
// refueling. We want the planner to be able to anticipate carts resuming
// service.

enum OutOfServiceJobState {
    BEFORE_BREAK,
    ON_BREAK
}

interface OutOfServiceJob extends Job {
    type: JobType.OUT_OF_SERVICE;

    state: OutOfServiceJobState;

    suspendLocation: LocationId;
    suspendTime: SimTime;
    resumeTime: SimTime;
}

enum TransferJobState {
    BEFORE_PICKUP,
    ENROUTE
}

// A valid plan must satisfy the following conditions:
//   1. Pickup not before pickupAfter time.
//   2. Sufficient time to load, travel to dropoffLocation, and unload before
//      dropoffBefore time.
//   3. Cart capacity not exceeded.
interface TransferJob extends Job {
    type: JobType.TRANSFER;

    state: TransferJobState;

    quantity: number;

    // ISSUE: should we specify intervals for pickup and dropoff?
    pickupLocation: LocationId;
    pickupAfter: SimTime;

    dropoffLocation: LocationId;
    dropoffBefore: SimTime;
}

type AnyJob = OutOfServiceJob | TransferJob;

///////////////////////////////////////////////////////////////////////////////
//
// Jobs
//
///////////////////////////////////////////////////////////////////////////////

enum ActionType {
    PICKUP,
    DROPOFF
}

interface Action {
    job: AnyJob;
    type: ActionType;
    location: LocationId;
    time: SimTime;
    quantity: number;
}

interface Plan {
    cart: Cart;
    actions: Action[];
    score: number;
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
type TransitTimeEstimator = (origin: LocationId, destination: LocationId, startTime: SimTime) => SimTime;
type LoadTimeEstimator = (location: LocationId, quantity: number, startTime: SimTime) => SimTime;
type UnloadTimeEstimator = (location: LocationId, quantity: number, startTime: SimTime) => SimTime;

class RoutePlanner {
    loadTimeEstimator: LoadTimeEstimator;
    unloadTimeEstimator: UnloadTimeEstimator;
    transitTimeEsitmator: TransitTimeEstimator;

    constructor(
        loadTimeEstimator: LoadTimeEstimator,
        unloadTimeEstimator: UnloadTimeEstimator,
        transitTimeEstimator: TransitTimeEstimator
    ) {
        this.loadTimeEstimator = loadTimeEstimator;
        this.unloadTimeEstimator = unloadTimeEstimator;
        this.transitTimeEsitmator = transitTimeEstimator;

        // Initialize permutation tables.
    }

    // Gets the highest scoring plan for a set of jobs.
    getBestPlan(cart: Cart, jobs: AnyJob[], time: SimTime): Plan | null {
        let maxScore = 0;
        let bestPlan: Plan | null = null;

        for (const plan of this.enumerateValidPlans(cart, jobs, time)) {
            if (plan.score > maxScore) {
                maxScore = plan.score;
                bestPlan = plan;
            }
        }

        return bestPlan;
    }

    *enumerateValidPlans(cart: Cart, jobs: AnyJob[], time: SimTime): IterableIterator<Plan> {
        for (const plan of this.enumerateAllPlans(cart, jobs, time)) {
            if (this.validateAndScore(plan, time)) {
                yield plan;
            }
        }
    }

    *enumerateAllPlans(cart: Cart, jobs: AnyJob[], time: SimTime): IterableIterator<Plan> {
        if (jobs.length >3) {
            const message = `Too many jobs for cart ${cart.id}`;
            throw TypeError(message);
        }

        // Form array of actions associated with jobs.
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
                            type: ActionType.DROPOFF,
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
                        type: ActionType.PICKUP,
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

            // Use pattern of nulls in action array to determine correct
            // permutation table.
        }
    }

    // Determines whether a plan satisfies the following constraints:
    //   1. Cart capacity is never exceeded.
    //   2. Dropoffs are before deadlines.
    // Assumes that plans never specify a job's dropoff before its pickup.
    // The enumerateAllPlans() generator only generates plans that meet this
    // criteria.
    //
    // NOTE that a plan with score zero may still be valid. An example would be
    // a plan that consists solely of an out-of-service interval.
    validateAndScore(plan: Plan, startTime: SimTime): boolean {
        let time = startTime;
        let location = plan.cart.lastKnownLocation;
        let payload = plan.cart.payload;
        let quantityTransferred = 0;

        for (const action of plan.actions) {
            time += this.transitTimeEsitmator(location, action.location, time);

            if (action.type === ActionType.DROPOFF) {
                time += this.unloadTimeEstimator(action.location, action.quantity, time);
                if (time > action.time) {
                    // This plan is invalid because it unloads after the deadline.
                    plan.score = 0;
                    return false;
                }
                payload -= action.quantity;
                quantityTransferred += action.quantity;

                if (payload < 0) {
                    // This should never happen. Log and throw.
                    const message = `Cart ${plan.cart.id} has negative payload.`;
                    throw TypeError(message);
                }
            }
            else if (action.type === ActionType.PICKUP) {
                if (action.time > time) {
                    // Wait until load is available for pickup.
                    time = action.time;

                    time += this.loadTimeEstimator(action.location, action.quantity, time);
                    payload += action.quantity;

                    if (payload > plan.cart.capacity) {
                        // This plan is invalid because its payload exceeds cart capacity.
                        plan.score = 0;
                        return false;
                    }
                }
            }
            else {
                // Should never get here. Log and throw.
                const message = `Unknown action type ${action.type}`;
                throw TypeError(message);
            }
        }

        // This plan does not violate any constraints.

        // Score the plan.
        // This score represents average amount transferred per unit time.
        // It does not bias towards loads that are closer to their deadlines.
        // It does not directly consider cart utilization (although this is
        // correlated with transfer rate).

        // NOTE: the scoring here is for the quality of the routing, not
        // the value of the plan itself. Therefore, the criteria should
        // probably be minimizing elapsed time (or elasped time doing work vs
        // travelling out of service).
//        compileError;
        const elapsedTime = time - startTime;
        plan.score = quantityTransferred / elapsedTime;

        return true;
    }
}

interface TrieNode {
    key: number;
    children: Trie;
}
type Trie = Array<TrieNode>;

let counter = 0;

function buildTrie(head: number[], tail: number[]): Trie {
    const children: Trie = [];

    if (tail.length === 0) {
        console.log(`${counter++}: ${head.join('')}`);
    }

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
    if (trie.length === 0) {
        console.log(head.join(''));
    }
    for (const branch of trie) {
        const action = actions[branch.key];
        if (action) {
            const newHead = [...head, action];
            walkTrie(branch.children, actions, newHead);
        }
    }
}

// buildTrie([], [0, 1, 2, 3]);
const trie = buildTrie([], [0, 1, 2, 3]);          // 89 permutations of three start-end pairs
walkTrie(trie, ['a', null, 'c', 'd', 'e', 'f'], []);
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
