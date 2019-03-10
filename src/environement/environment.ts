import { Cart, CartId, Job, JobId } from "../environement";
import { LoadTimeEstimator, RouteNextStep, TransitTimeEstimator, UnloadTimeEstimator } from '../estimators';
import { RoutePlanner } from '../planner';
import { Trace } from './trace';


// The Environment class holds the state of the world. This state includes
//   1. estimator functions that model physical activities in the world,
//      e.g. the time required to move from one place to another, the time
//      needed to load items onto a cart, etc.
//   2. locations of items like Carts and their capacities and current
//      payloads.
//   3. status of known Jobs, e.g. moving items from place to place within
//      a certain time window, going out of service for 15 minutes to
//      refuel, etc.
export class Environment {
    //
    // Estimators and routing.
    //
    loadTimeEstimator: LoadTimeEstimator;
    routeNextStep: RouteNextStep;
    unloadTimeEstimator: UnloadTimeEstimator;
    transitTimeEstimator: TransitTimeEstimator;

    private trace: Trace | undefined;

    routePlanner: RoutePlanner;

    //
    // The fleet.
    //
    fleet: Map<CartId, Cart>;

    //
    // Job related
    //
    jobs: Map<JobId, Job>;

    successfulJobs: Job[];
    failedJobs: Job[];

    // Environment constructor parameters:
    //
    //   loadTimeEstimator
    //      function that estimate the time required to load a specified quantity
    //   unloadTimeEstimator
    //      function that estimate the time required to unload a specified quantity
    //   routeNextStep
    //      function that returns the next LocationId on a route
    //   transitTimeEstimator
    //      function that returns the time required to drive from a specific
    //      LocationId to another LocationId.
    //
    //   trace
    //      optional object that logs simulator operations.
    constructor(
        loadTimeEstimator: LoadTimeEstimator,
        unloadTimeEstimator: UnloadTimeEstimator,
        routeNextStep: RouteNextStep,
        transitTimeEstimator: TransitTimeEstimator,
        trace: Trace | undefined
    ) {
        this.loadTimeEstimator = loadTimeEstimator;
        this.routeNextStep = routeNextStep;
        this.unloadTimeEstimator = unloadTimeEstimator;
        this.transitTimeEstimator = transitTimeEstimator;
        this.trace = trace;

        this.fleet = new Map<CartId, Cart>();

        this.jobs = new Map<JobId, Job>();

        this.successfulJobs = [];
        this.failedJobs = [];

        // TODO: This maxJobs cannot be less than the one used by JobAssigner.
        const maxJobs = 3;
        this.routePlanner = new RoutePlanner(
            maxJobs,
            this.loadTimeEstimator,
            this.unloadTimeEstimator,
            this.transitTimeEstimator);
    }

    // Adds a cart to the environment.
    // Once added, a cart cannot be removed, but it can be placed out of service.
    addCart(cart: Cart) {
        if (this.fleet.has(cart.id)) {
            const message = `Fleet already has Cart ${cart.id}`;
            throw TypeError(message);
        }
        this.fleet.set(cart.id, cart);
    }

    // Used at the beginning of a planning cycle.
    // The cartSnapshot() method makes a copy of a set of Carts, indexed by CartId.
    // The copied Carts are distinct from the originals.
    cartSnapshot() {
        const copy = new Map<CartId, Cart>();

        // Copy over the carts, indexing each by its id.
        // WARNING: This code is brittle because it relies on knowledge of
        // that all fields of Cart are primitive.
        for (const cart of this.fleet.values()) {
            copy.set(cart.id, {...cart});
        }
    
        return copy;
    }

    // Used at the beginning of a planning cycle.
    // The jobSnapshot() method makes a copy of a set of Jobs, indexed by JobId.
    // As each job is copied, its assignedTo field, if not null, is replaced by
    // a reference to the corresponding Cart in `cartsCopy`. 
    jobSnapshot(cartsCopy: Map<CartId, Cart>): Map<JobId, Job> {
        const copy = new Map<JobId, Job>();

        // Copy over jobs, indexing each by its id.
        // If assignedTo is set, use its copy.
        // WARNING: This code is brittle because it relies on knowledge of
        // which fields of Job are primitives.
        for (const job of this.jobs.values()) {
            let assignedTo = null;
            if (job.assignedTo) {
                assignedTo = cartsCopy.get(job.assignedTo.id) as Cart;
            }
            copy.set(job.id, {...job, assignedTo});
        }

        return copy;
    }

    // Adds a Job to the Environment or replaces an existing Job with a new
    // definition.
    //
    // NOTE that updated job will not become visible to Carts until new plan
    // has been merged.
    addJob(job: Job) {
        this.jobs.set(job.id, job);
    }

    // Marks a job as being assigned to a Cart and adds the job to the set
    // of assigned jobs.
    assignJob(job: Job, cart: Cart)
    {
        job.assignedTo = cart;
        if (this.trace) {
            this.trace.jobAssigned(job);
        }
    }

    completeJob(job: Job)
    {
        this.jobs.delete(job.id);
        this.successfulJobs.push(job);
        if (this.trace) {
            this.trace.jobSucceeded(job);
        }
    }

    failJob(job: Job)
    {
        this.jobs.delete(job.id);
        this.failedJobs.push(job);
        if (this.trace) {
            this.trace.jobFailed(job);
        }
    }
}
