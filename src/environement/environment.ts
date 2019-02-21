import { Condition } from './condition'
import { RoutePlanner } from '../planner';
import { Trace, TextTrace } from './trace';
import { AnyJob, Cart, CartId } from "../types";
import { LoadTimeEstimator, RouteNextStep, TransitTimeEstimator, UnloadTimeEstimator } from '../types';


/*
Job initially enter the system via the event queue, using the introduceJob() method.
At the specified time, an introduced job becomes visible to the environment and is added to the backlog.
Jobs on the backlog may or may not be assigned to a cart at any given time.

The input to the planner consists of the job backlog, and the states of each of the carts.
The planner generates a job assignment, which consists of a set of jobs for each cart.
The new job assignment will always maintain the assignments of jobs that have already been started.

The new job assignment is merged with the current job assignment to produce the assignment, moving forward.

Race condition:
Cart is assigned A, B, C.
Cart starts on A.
    Planner starts.
    Cart finishes A and starts on B.
    Planner finishes with assignment A, C, D.
    How does cart merge [A, B, C] with [A, C, D]?
        Challenge: [C, D] might not be appropriate for cart doing B.
        Challenge: Taking the union of old and new assignments might make very complicated plan.

Idea: planner assumes cart has dibs on any task that can be started in planning window.
*/

export class Environment {
    //
    // Estimators and routing.
    //
    loadTimeEstimator: LoadTimeEstimator;
    routeNextStep: RouteNextStep;
    unloadTimeEstimator: UnloadTimeEstimator;
    transitTimeEstimator: TransitTimeEstimator;

    trace: Trace | undefined;

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



    // TODO: need some way to pass initial cart state.

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
        // TODO: initialize fleet.

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

    assignJob(job: AnyJob, cart: Cart)
    {
        // Check for already assigned.
        // Check for cart undefined.
        job.assignedTo = cart.id;
        this.assignedJobs.add(job);
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

        //     logger(`PICKUP ${action.quantity} bags at gate ${action.location} after ${action.time} (job ${action.job.id})`);
        //     logger(`    ${state.time}: drive for ${transitTime}s to gate ${action.location}`);
        //     logger(`    ${state.time}: wait ${waitTime}s until ${action.time}`);
        //     logger(`    ${state.time}: load ${action.quantity} bags in ${loadTime}s.`);
