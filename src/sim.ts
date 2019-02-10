// DESIGN NOTE: Data structures typically fall into one of the three following categories:
//   1. Inputs to the simulator, e.g. flight schedule, manifests, airport configuration.
//        ==> Should be POJO for serialization.
//   2. Current state of the simulation, e.g. carts, jobs, etc.
//   3. Outputs of the simulator, e.g. actions taken and their consequences, metrics.
//        ==> Should be POJO for serialization.

// DESIGN ISSUES:
//   How to balance polymorphism/encapsulation with desire to use POJOs.
//     ==> The use of POJOs causes event/object logic to be centralized in switch statements.
//     ==> Either switch statement is used to bind methods at initialization
//     ==> or they are used during runtime.
//   Is there any advantage to using the Redux pattern that eliminates side-effects?
//   Need some way for the agent to provisionally assign jobs to carts.
//     ==> This allows consideration of future assignments when optimizing.

// POTENTIAL CAPABILITIES
//   Ability to plan over a reasonable sized window of time (vs point in time)
//     ==> Predict future jobs
//     ==> Predict future capacity at different locations.
//     ==> This is from carts with space driving by or carts completing.
//   Ability to reroute a job.
//     ==> Pickup bags for G10 at F21. Drive to D15. Pick up more bags for F21.
//   Ability to save and restore state of simulator. Resume after restore.
//     ??? Why is this necessary/useful?
//     ??? Could one implement this by replaying recorded inputs? Reply inputs, events, or side effects?
//     ==> All state should be in POJO objects.
//     ==> No requirement to run constructors.
//     ==> Methods don't reside on objects.
//     ==> Objects can't hold references to other objects.
//     ==> Event queue needs to contain POJOs instead of things like lambdas.
//   Ability for a ground delay to imact the arrival time of a future inbound flight.
//     ==> Ability to edit queued events.
//     ==> Use of a priority queue to reposition events as times change.
//     ==> Ground delay policy.
//   Ability for an inbound flight delay to cause an outbound flight delay.
//     ==> Some simulator object that stores updated departure time.
//     ==> Priority queue, editing events, etc.
//   Ability to distinguish cart/tug combinations from their drivers.
//   Ability to provide simulator inputs incrementally (in order to consume a live feed).
//   Ability to change arrival or departure times on short notice. (e.g. tower keeps extending by 5 min, ground stop, etc.)
//   Reproducibility. Start with same seed. Simulation agent cannot effect random events.
//   Simulated/synthetic inputs and input variability. (e.g. dial up delays, add random ground stops, etc.)
//   Ability for simulated cart to deviate from orders (e.g. flat tire, out of gas).
//   Robustness in presense of errors - e.g. another cart accidentally picked up the bags due to planner error.
//     ==> Should be able to command bad plans without crashing/halting simulation.
//   Modelling cart range/endurance.

// POTENTIALLY OUT OF SCOPE
//   Modelling ground delays due to congestion caused by job assignments. (e.g. traffic jam/backlog of carts at sortation.)

// PLANNER
//   IDEA: create multiple plans for jobs (within some time horizon).
//   Then use greedy algorithm or better optimization to accept the best tiling of plans.
//   QUESTION: how to keep all carts from bidding on / planning for the most lucrative jobs?
//   Perhaps each card bids on every job, or every pair of jobs (that can be accomplished/started in a window).
//      ~200 carts * ~200 jobs = 40k plans created and sorted.
//        Probably want to examine distribution of rewards - might be able to use boulder/sand/ash approach
//      Also, keep in mind that at any given time, only a small fraction of the carts have available capacity.
//        This might reduce the combinatorics.
//      Come up with the permutation of the identity matrix that maximizes the product with the reward matrix. 
//   Perhaps pick small random subproblems and compute optimal solutions.
//      Completely random or by geo?
//   Perhaps pick top-n non-conflicting plans. Then have remaining carts replan and bid again.
//      Could move to smaller and smaller rounds, getting more greedy as the best plans are taken.
//   Could go straigt greedy
//      Everyone plans. Then accept plan for cart with highest score.
//      Then everyone not invalidated replans.
//   Only command first step of each plan. Then replan for each window.

// RESEARCH
//   Get distribution of plan ROIs or job metrics. Is it Zipfian?

/*
EXAMPLE PLAN

goto A12
pickup 5 for B15
goto A17
pickup 3 for B15
goto B3
pickup 10 for B22
goto B15
dropoff 8
goto B22
dropoff 10

Metrics:
  Successful completions/minute?
  Capacity utilization
  ROI
*/ 

/*
POSSIBLE ALGORITHM PSEUDO CODE

q: PriorityQueue<Plan>
for (const cart of Carts)
    const plan = cart.plan();
    if (plan)
        q.add(plan)

while (q.count > 0) {
    const plan = q.pop();
    if (plan.isStillValid())
        plan.commit()
    else {
        // create new plan for this cart and enqueue.
        const plan = plan.cart.plan(); (= plan.replan()?)
        if (plan) {
            q.add(plan)
        }
    }
}

*/

//
// Universal types
//

export type Seconds = number;       // Smallest unit of time in the simulation.
export type Time = Seconds;         // Time in the simulation.
export type Flight = number;        // The identifier of a flight, its flight number.

export type LocationId = string;    // Named of a location at the airport. Could be a gate, baggage sortation induction, cart parling area.

export type DriverId = number;      // Unique id for a driver.

// NOTE: currently assuming a CartId referrs to a cart/tug combination.
export type CartId = number;        // Unique id for baggage cart.

//
// Constants
//

const MINUTES = 60;             // Seconds per minute.
const HOURS = MINUTES * 60;     // Seconds per hour.


//
// Simulator inputs
//


// A Transfer is a group of bags going to the same outbound flight (or other destination?)
// TODO: can we create transfers to/from baggage claim or baggage sortation?
// TODO: do transfers need sources? Source could be implicit from inbound
// flight if we disallow check-in, sortation, etc.
export interface Transfer {
    count: number;                  // Number of bags in this transfer.
    destination: OutboundFlight;
}

export interface InboundFlight {
    Flight: number;
    arrival: Time;
    gate: LocationId;

    // Baggage
    // TODO: currently only modelling bags that transfer to outbound flights.
    // Need to model bags at destination.
    transfers: Transfer[];  // Bags transferring to other flights.
    terminations: number;   // Number of bags for baggage claim.
}

export interface OutboundFlight {
    Flight: number;
    departure: Time;
    gate: LocationId;
    originations: number;   // Number of bags from checkin counter.
}

// Represents a single aircraft arriving and departing.
// Paring the inbound and outbound flights allows the system to model the impact
// of late arrivals on aircraft turn-around.
export interface TurnAround {
    inbound: InboundFlight;
    outbound: OutboundFlight;
}

//
// Schedule Model
//
export interface Schedule {
    // NOTE: would like to use Flight instead of number here, but Typescript disallows.
    inbound: { [flight: number]: InboundFlight };
    outbound: { [flight: number]: OutboundFlight };
}

//
// Staffing model
//
export interface Interval {
    start: Time;
    stop: Time;
}

export interface Driver {
    id: DriverId;
    working: Interval[];
}

export interface Staff {
    drivers(): IterableIterator<Driver>;
}

//
// Airport model
//
export interface Airport {
    gateToGateLatency(source: LocationId, destination: LocationId): Seconds;
    sortationLatency(): Seconds;
    maximumAllowablePlaneToClaim(): Seconds;
    minimumAircraftTurnaroundTime(): Seconds;
}

// Simulation-time operations
//   1. Create new jobs from InboundFlight and OutboundFlight.
//   1. Split an unassigned job into two smaller jobs. (e.g. cart takes half of the bags)
//        ==> Partial pick up - cart gets newly created job.
//        ==> Partial drop off - tarmac/destination gets newly created job. Cart retains old job.
//   2. Assign a job to a cart.
//   3. Merge jobs with identical destinations and expirations. (e.g. pick up more bags for a destination already on-cart).
//   4. Convert one type of job into another (e.g. gate delivery missed so go to sortation)

// NOTE: ETCs for jobs on cart depend on intended order of operations for cart.
// How should the cart's plan be expressed? Who computes and updates ETCs?
// Perhaps any change to cart state recomputes all task ETCs?
// Do unassigned tasks have ETCs?

export interface Job {
    count: number;              // Nummber of bags in this job.
    source: LocationId;         // Pickup point for bags.
    destination: LocationId;    // Dropoff point for bags.
    dueAt: Time;

    // Enroute to start time
    // Pickup time
    // Enroute to end time
    // Dropoff time
    // Estimated Time of Completion (ETC)
}

export interface Cart {
    id: CartId;
    capacity: number;           // Number of bags this cart can accomodate.

    availableCapacity(): number;    // Number of additional bags that could be loaded.

    jobs(): IterableIterator<Job>   // // Jobs currently assigned to this cart.
}

//
// Simulator actions
//

export enum ActionType {
    CREATE,
    SPLIT,
    MERGE,
    ASSIGN,
    COMPLETE
};

export interface Action {
    type: ActionType;
}

export interface CreateAction extends Action {
    type: ActionType.CREATE;
    count: number;              // Nummber of bags in this job.
    source: LocationId;         // Pickup point for bags.
    destination: LocationId;    // Dropoff point for bags.
    dueAt: Time;
}

export interface SpltAction extends Action {
    type: ActionType.SPLIT;
    id: ActionId;
    count: number;
}