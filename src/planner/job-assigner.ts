import { SimTime } from '../core';
import { Cart, CartId, Job } from '../environement';
import { LoadTimeEstimator, TransitTimeEstimator, UnloadTimeEstimator } from '../estimators';

import { combinations } from './combinations';
import { RoutePlanner } from './route-planner';

interface Assignment {
    cart: Cart,
    jobs: Job[],
    score: number
}

class JobAssigner {
    private readonly maxJobs: number;
    private readonly routePlanner: RoutePlanner;

    constructor(
        maxJobs: number,
        loadTimeEstimator: LoadTimeEstimator,
        unloadTimeEstimator: UnloadTimeEstimator,
        transitTimeEstimator: TransitTimeEstimator,
    ) {
        this.maxJobs = maxJobs;
        this.routePlanner = new RoutePlanner(
            maxJobs,
            loadTimeEstimator,
            unloadTimeEstimator,
            transitTimeEstimator
        );
    }

    createAssignment(
        jobs: IterableIterator<Job>,
        carts: IterableIterator<Cart>,
        time: SimTime
    ): Map<Cart, Job[]> {
        const assignments = new Map<Cart, Job[]>();
        const unassigned: Job[] = [];

        for (const cart of carts) {
            assignments.set(cart, []);
        }

        for (const job of jobs) {
            const cart = job.assignedTo;
            if (cart) {
                // This job is already assigned.
                // Unless there is a bug, we will always find cart in cartJobs.
                const cartJobs = assignments.get(cart) as Job[];
                cartJobs.push(job);
            }
            else {
                // This job is no assigned.
                unassigned.push(job);
            }
        }

        // Enumerate every {cart, [jobs]}
        const alternatives: Assignment[] = [];
        for (const [cart, assigned] of assignments) {
            const newJobs = Math.max(this.maxJobs - assigned.length, 0);
            if (newJobs > 0) {
                // TODO: loop from 0..newJobs?
                // Issue: what is [Short] is always a better score than [Short, Long],
                // even though Long will have to be done eventually?
                // Perhaps we want to enumerate and select all 3-tuples and then
                // only look at 2-tuples if there were some carts unassigned?
                for (const combination of combinations(newJobs, unassigned.length)) {
                    const slate = [...assigned, ...(combination.map((n) => unassigned[n]))];
                    const plan = this.routePlanner.getBestRoute(cart, slate, time);
                    if (plan) {
                        alternatives.push({
                            cart,
                            jobs: slate,
                            score: plan.score
                        })
                    }
                }   
            }
            else {
                // This is the only plan for this cart.
                // Set score to Infinity.
                alternatives.push({
                    cart,
                    jobs: assigned,
                    score: Infinity
                })
            }
        }

        // Now we have all of the possible assignments.
        // Sort them by decreasing score.
        alternatives.sort((a, b) => a.score - b.score);

        // Use greedy algorithm to choose assignments.
        for (let i = 0; i < alternatives.length; ++i) {
            // if slates[i].cart does not already have a slate
            //   choose this one
        }


        // First add all of the in-progress jobs to the assignment.

        // For each partial assignment, generate combinations of feasible full assignments.
        // Add these assignments to priority queue based on score.
        // Also add these assignments to map from JobId to Assignment[].

        // TODO: actually return new assignments.
        return assignments;
    }
}