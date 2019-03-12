import { Agent, Clock, Condition, NextStep, SimTime } from '../core';
import { Cart, Environment, Job, Trace } from '../environement';

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
export class SimpleDispatcher implements Dispatcher {
    private readonly clock: Clock;
    private readonly env: Environment;
    private readonly trace: Trace;

    private shuttingDown: boolean;

    private unallocatedJobs: Job[];
    private readonly jobAvailableCondition: Condition;


    constructor(clock: Clock, env: Environment, trace: Trace) {
        this.clock = clock;
        this.env = env;
        this.trace = trace;

        this.shuttingDown = false;

        this.unallocatedJobs = [];
        this.jobAvailableCondition = new Condition();
    }

    *waitForNextPlan(planTime: SimTime): Agent {
        if (!this.shuttingDown) {
            yield this.waitForJob();
        }
    }

    getCurrentPlanTime() {
        return this.clock.time;
    }

    newerPlanAvailable(planTime: SimTime): boolean {
        // The simple dispatcher never changes plans.
        return false;
    }

    getPlan(cart: Cart): Job[] {
        // Select an unallocated job in FIFO order.
        const job = this.unallocatedJobs.shift() as Job;
        let jobs: Job[];
        if (job) {
            // Don't actually need to assign job here as Cart will assign to
            // itself when it commits (loads items).
            jobs = [job];
        }
        else {
            jobs = [];
        }

        if (this.trace) {
            this.trace.cartPlanIs(cart, jobs, jobs);
        }

        return jobs;
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
        
        // Add the job to the list of unallocated jobs.
        this.unallocatedJobs.push(job);
        this.jobAvailableCondition.wakeOne();
    }


    // Agent the runs main planning loop.
    *planningLoop(): Agent {
        // The simple dispatcher doesn't have a planning loop.
    }

    // Agent that shuts down the planning loop at a specified time.
    *shutdownAt(time: SimTime): Agent {
        yield this.clock.until(time);
        this.shuttingDown = true;
    }

    isShuttingDown() {
        return this.shuttingDown;
    }

    private waitForJob(): NextStep {
        return (agent: Agent) => {
            this.jobAvailableCondition.sleep(agent);
        }
    }
}
