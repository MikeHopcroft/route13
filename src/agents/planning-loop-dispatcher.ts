import { Agent, Clock, Condition, NextStep, SimTime } from '../core';
import { Cart, Environment, Job, Trace } from '../environement';
import { merge, Planner } from '../planner';

import { Dispatcher } from './dispatcher';

// The Dispatcher class assigns Jobs to Drivers.
//
// The current, naive implementation maintains a queue of jobs that have been
// introduced to the system. These jobs are assigned to carts as the carts
// become available.
//
// DESIGN INTENT is to replace this Dispatcher with a more sophisticated one
// that chooses job assignments from the set of Plans associated with the cross
// products of Carts and tuples of unassigned Jobs.
export class PlanningLoopDispatcher implements Dispatcher {
    private readonly clock: Clock;
    private readonly env: Environment;
    private readonly trace: Trace;
    private readonly planner: Planner | null;

    // TOOD: planningTime should be a parameter.
    // Or it could be provided by the Planner.
    private readonly planningTime = 5000;

    private shuttingDown: boolean;
    private readonly jobAvailableCondition: Condition;

    private currentPlan: Map<Cart, Job[]>;
    private currentPlanTime: SimTime;
    private newPlanAvailable: Condition;

    constructor(clock: Clock, env: Environment, trace: Trace, planner: Planner | null) {
        this.clock = clock;
        this.env = env;
        this.trace = trace;
        this.planner = planner;

        this.shuttingDown = false;

        this.jobAvailableCondition = new Condition();

        this.currentPlan = new Map<Cart, Job[]>();
        this.currentPlanTime = -Infinity;
        this.newPlanAvailable = new Condition();
    }

    // updateJob?
    // cancelJob?

    waitForJob(): NextStep {
        return (agent: Agent) => {
            this.jobAvailableCondition.sleep(agent);
        }
    }

    private waitForPlan(): NextStep {
        return (agent: Agent) => {
            this.newPlanAvailable.sleep(agent);
        }
    }

    *waitForNextPlan(planTime: SimTime): IterableIterator<NextStep> {
        if (planTime >= this.currentPlanTime && !this.shuttingDown) {
            // If we already have the current plan, wait for a new one.
            yield this.waitForPlan();
        }
    }

    getPlan(cart: Cart): Job[] {
        const jobs = this.currentPlan.get(cart);
        if (!jobs) {
            throw TypeError(`Unknown cart ${cart.id}.`);
        }
        return jobs;
    }

    getCurrentPlanTime() {
        return this.currentPlanTime;
    }

    newerPlanAvailable(planTime: SimTime): boolean {
        return planTime < this.currentPlanTime;
    }

    isShuttingDown() {
        return this.shuttingDown;
    }

    // Makes the dispatcher aware of a Job. Once a Job has been introduced
    // into the dispatcher, it can be considered for planning purposes.
    //
    // Current implementation just puts the job in a queue. Jobs are assigned
    // from the queue as Carts become available.
    //
    *introduceJob(job: Job, time: SimTime): Agent {
        // TODO: it is possible to introduce a job after its start time?
        // Is this ok? Should we log and throw?

        // Wait until it is time to introduce the Job.
        yield this.clock.until(time);

        // Add the job to the environment.
        this.env.addJob(job);

        // Add the job to the list of unassigned jobs.
        this.jobAvailableCondition.wakeOne();
    }

    // Agent the runs main planning loop.
    *planningLoop() {
        if (this.planner) {
            while (!this.shuttingDown) {
                yield* this.updateJobAssignments();
            }
        }
    }

    // Agent that runs the planner once and updates job assignments.
    private *updateJobAssignments() {
        if (!this.shuttingDown) {
            this.trace.plannerStarted();

            // Grab a snapshot of the carts and jobs.
            // This snapshot will be passed to the planner.
            const carts = this.env.cartSnapshot();
            const jobs = this.env.jobSnapshot(carts);
          
            // For now, just simulate time to plan.
            // In a real implementation, planning might happen out of process,
            // possibly on another server.
            const planReadyTime = this.clock.time + this.planningTime;
            yield this.clock.until(planReadyTime);

            // For now, run the planner in process.
            // Create the new plan, based on the snapshot that was saved.
            const plan =
                (this.planner as Planner).createAssignment(jobs.values(), carts.values(), planReadyTime);

            // Merge the new plan into the existing plan.
            this.currentPlan = merge(this.env.fleet, this.env.jobs, plan);
            this.currentPlanTime = this.clock.time;

            this.trace.plannerFinished();

            // Notify all waiting drivers that a new plan is ready.
            this.newPlanAvailable.wakeAll();
        }
    }

    // Agent that shuts down the planning loop at a specified time.
    *shutdownAt(time: SimTime) {
        yield this.clock.until(time);
        this.shuttingDown = true;
    }
}
