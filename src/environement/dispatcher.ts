import { Clock } from './clock';
import { Continuation, NextStep } from './continuation';
import { Environment } from './environment';
import { AnyJob, SimTime } from '../types';

export class Dispatcher {
    private clock: Clock;
    private env: Environment;

    private shuttingDown: boolean;

    constructor(clock: Clock, env: Environment) {
        this.clock = clock;
        this.env = env;
        this.shuttingDown = false;
    }

    // updateJob?
    // cancelJob?

    *mainLoop() {
        while (!this.shuttingDown) {
            yield* this.updateJobAssignments();
        }
    }

    waitForJob(): NextStep {
        return (future: Continuation) => {
            this.env.jobAvailableCondition.sleep(future);
        }
    }

    *introduceJob(job: AnyJob, time: SimTime): Continuation {
        // TODO: it is possible to introduce a job after its start time. Is this ok?
        // Should we log and throw?
        yield this.clock.until(time);

        // TODO: add job to list of outstanding jobs.
        this.env.unassignedJobs.push(job);
        this.env.jobAvailableCondition.wakeOne();
    }


    *updateJobAssignments() {
        // Determine new job assignments
        //   Send cart and job state to planner.
        //   Get back new collection of job assignments.

        // For now, just simulate time to plan.
        const planningTime = 5000;
        yield this.clock.time + planningTime;

        // Apply job assignments.
        //   Merge each new assignment into an existing assignment.
        // For now, simulate application of plan by doing nothing.
    }
}