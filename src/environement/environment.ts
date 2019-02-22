import { Condition } from './condition'
import { RoutePlanner } from '../planner';
import { Trace, TextTrace } from './trace';
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
    jobAvailableCondition: Condition;

    assignedJobs: Set<AnyJob>;
    successfulJobs: AnyJob[];
    failedJobs: AnyJob[];

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
        this.jobAvailableCondition = new Condition();

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
