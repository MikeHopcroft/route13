import { Agent, Clock, Condition, NextStep, SimTime } from '../core';
import { Cart, Environment, Job, Trace } from '../environement';
import { merge2, Planner } from '../planner';

// The Dispatcher class assigns Jobs to Drivers.
//
// The current, naive implementation maintains a queue of jobs that have been
// introduced to the system. These jobs are assigned to carts as the carts
// become available.
//
// DESIGN INTENT is to replace this Dispatcher with a more sophisticated one
// that chooses job assignments from the set of Plans associated with the cross
// products of Carts and tuples of unassigned Jobs.
export class Dispatcher {
    private readonly clock: Clock;
    private readonly env: Environment;
    private readonly trace: Trace;
    private readonly planner: Planner | null;

    // TOOD: planningTime should be a parameter.
    // Or it could be provided by the Planner.
    private readonly planningTime = 5000;

    shuttingDown: boolean;
    private readonly jobAvailableCondition: Condition;

    currentPlan: Map<Cart, Job[]>;
    currentPlanTime: SimTime;
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

    *waitForNextPlan(planTime: SimTime) {
        if (planTime >= this.currentPlanTime && !this.shuttingDown) {
            yield this.waitForPlan();
        }
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
    // NOTE: Currently the planner does nothing, but the loop runs to
    // demonstrate the pattern.
    *planningLoop() {
        if (this.planner) {
            while (!this.shuttingDown) {
                yield* this.updateJobAssignments();
            }
        }
    }

    // Agent that runs the planner once and updates job assignments.
    // NOTE: Currently the planner does nothing but log to trace.
    private *updateJobAssignments() {
        if (!this.shuttingDown) {
            this.trace.plannerStarted();

            // TODO: Implement
            // Determine new job assignments
            //   Send cart and job state to planner.
            //   Get back new collection of job assignments.

            const carts = this.env.cartSnapshot();
            const jobs = this.env.jobSnapshot(carts);
            const planReadyTime = this.clock.time + this.planningTime;

            // For now, just simulate time to plan.
            // In a real implementation, planning might happen out of process,
            // or, potentially, on another server.
            yield this.clock.until(planReadyTime);

            // Create new plan.
            const plan =
                (this.planner as Planner).createAssignment(jobs.values(), carts.values(), planReadyTime);

            this.currentPlan = merge2(this.env.fleet, this.env.jobs, plan);

            this.trace.plannerFinished();

            // Notify all waiting drivers of the new plan.
            this.newPlanAvailable.wakeAll();
        }
    }

    // Agent that shuts down the planning loop at a specified time.
    *shutdownAt(time: SimTime) {
        yield this.clock.until(time);
        this.shuttingDown = true;
    }
}