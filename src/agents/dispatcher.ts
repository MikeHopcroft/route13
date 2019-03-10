import { Agent, SimTime } from '../core';
import { Cart, Job } from '../environement';

export interface Dispatcher {
    // An agent that waits until the next plan is available.
    waitForNextPlan(planTime: SimTime): Agent;

    // Returns true if there if information in a newly available plan
    // might contradict the plan with specified `planTime`.
    newerPlanAvailable(planTime: SimTime): boolean;

    // The time the current plan became available.
    getCurrentPlanTime(): SimTime;

    // Returns the current plan for a specific Cart.
    getPlan(cart: Cart): Job[];
    
    // Introduces a Job into the Dispatcher at a specific time in the future.
    introduceJob(job: Job, time: SimTime): Agent;

    // Starts the planning loop.
    planningLoop(): Agent;
    
    // Shuts down the planning loop at a specified time.
    shutdownAt(time: SimTime): Agent;

    // Returns true if the Dispatcher is shutting down.
    isShuttingDown(): boolean;
}
