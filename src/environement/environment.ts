import { RoutePlanner } from '../planner';
import { Trace } from './trace';
import { AnyJob, Cart, CartId } from "../types";
import { LoadTimeEstimator, RouteNextStep, TransitTimeEstimator, UnloadTimeEstimator } from '../types';


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
    private fleet: Map<CartId, Cart>;

    //
    // Job related
    //
    unassignedJobs: AnyJob[];

    assignedJobs: Set<AnyJob>;
    successfulJobs: AnyJob[];
    failedJobs: AnyJob[];

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

        this.unassignedJobs = [];

        this.assignedJobs = new Set<AnyJob>();
        this.successfulJobs = [];
        this.failedJobs = [];

        const maxJobs = 2;
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

    // Marks a job as being assigned to a Cart and adds the job to the set
    // of assigned jobs.
    assignJob(job: AnyJob, cart: Cart)
    {
        this.assignedJobs.add(job);
        job.assignedTo = cart;
        if (this.trace) {
            this.trace.jobAssigned(job);
        }
    }

    completeJob(job: AnyJob)
    {
        // Check for job not already assigned.
        this.assignedJobs.delete(job);
        this.successfulJobs.push(job);
        if (this.trace) {
            this.trace.jobSucceeded(job);
        }
    }

    failJob(job: AnyJob)
    {
        // Check for job not already assigned.
        this.assignedJobs.delete(job);
        this.failedJobs.push(job);
        if (this.trace) {
            this.trace.jobFailed(job);
        }
    }
}
