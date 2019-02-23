import { Clock, Condition, Continuation, NextStep } from '../core';
import { AnyJob, Environment, Trace } from '../environement';
import { SimTime } from '../types';

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
    private clock: Clock;
    private env: Environment;
    private trace: Trace;

    private shuttingDown: boolean;
    private jobAvailableCondition: Condition;

    constructor(clock: Clock, env: Environment, trace: Trace) {
        this.clock = clock;
        this.env = env;
        this.trace = trace;

        this.shuttingDown = false;

        this.jobAvailableCondition = new Condition();
    }

    // updateJob?
    // cancelJob?

    waitForJob(): NextStep {
        return (continuation: Continuation) => {
            this.jobAvailableCondition.sleep(continuation);
        }
    }

    // Makes the dispatcher aware of a Job. Once a Job has been introduced
    // into the dispatcher, it can be considered for planning purposes.
    //
    // Current implementation just puts the job in a queue. Jobs are assigned
    // from the queue as Carts become available.
    //
    *introduceJob(job: AnyJob, time: SimTime): Continuation {
        // TODO: it is possible to introduce a job after its start time?
        // Is this ok? Should we log and throw?

        // Wait until it is time to introduce the Job.
        yield this.clock.until(time);

        if (job.assignedTo) {
            const message = `Job ${job.assignedTo} already assigned to Cart ${job.assignedTo.id}`;
            throw TypeError(message);
        }

        // Add the job to the list of unassigned jobs.
        this.env.unassignedJobs.push(job);
        this.jobAvailableCondition.wakeOne();
    }

    // Continuation the runs main planning loop.
    // NOTE: Currently the planner does nothing, but the loop runs to
    // demonstrate the pattern.
    *planningLoop() {
        while (!this.shuttingDown) {
            yield* this.updateJobAssignments();
        }
    }

    // Continuation that runs the planner once and updates job assignments.
    // NOTE: Currently the planner does nothing but log to trace.
    private *updateJobAssignments() {
        if (!this.shuttingDown) {
            this.trace.plannerStarted();

            // TODO: Implement
            // Determine new job assignments
            //   Send cart and job state to planner.
            //   Get back new collection of job assignments.

            // For now, just simulate time to plan.
            // In a real implementation, planning might happen out of process,
            // or, potentially, on another server.
            const planningTime = 5000;
            yield this.clock.until(this.clock.time + planningTime);

            this.trace.plannerFinished();

            // TODO: Implement
            // Apply job assignments.
            //   Merge each new assignment into an existing assignment.
            // For now, simulate application of plan by doing nothing.
        }
    }

    // Continuation that shuts down the planning loop at a specified time.
    *shutdownAt(time: SimTime) {
        yield this.clock.until(time);
        this.shuttingDown = true;
    }
}