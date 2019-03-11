import { SimTime } from '../core';
import { Cart, Job } from '../environement';
import { LoadTimeEstimator, TransitTimeEstimator, UnloadTimeEstimator } from '../estimators';

import { combinations } from './combinations';
import { Assignment, Planner } from './planner';
import { RoutePlanner } from './route-planner';


///////////////////////////////////////////////////////////////////////////////
//
// JobAssigner
//
// Brute force enumeration of all carts paired with all combinations of N jobs.
// Then greedy selection from enumerated job assignments.
//
///////////////////////////////////////////////////////////////////////////////
export class JobAssigner implements Planner {
    private readonly maxJobCount: number;
    private readonly routePlanner: RoutePlanner;

    loadTimeEstimator: LoadTimeEstimator;
    unloadTimeEstimator: UnloadTimeEstimator;
    transitTimeEstimator: TransitTimeEstimator;

    constructor(
        maxJobCount: number,
        loadTimeEstimator: LoadTimeEstimator,
        unloadTimeEstimator: UnloadTimeEstimator,
        transitTimeEstimator: TransitTimeEstimator,
    ) {
        this.maxJobCount = maxJobCount;
        this.routePlanner = new RoutePlanner(
            maxJobCount,
            loadTimeEstimator,
            unloadTimeEstimator,
            transitTimeEstimator
        );

        this.loadTimeEstimator = loadTimeEstimator;
        this.unloadTimeEstimator = unloadTimeEstimator;
        this.transitTimeEstimator = transitTimeEstimator;
    }

    createAssignment(
        jobs: IterableIterator<Job>,
        carts: IterableIterator<Cart>,
        time: SimTime
    ): Map<Cart, Assignment> {
        const existingAssignments = new Map<Cart, Job[]>();
        const unassigned: Job[] = [];

        // Create an empty job assignment for each cart.
        for (const cart of carts) {
            existingAssignments.set(cart, []);
        }

        // Add currently assigned jobs to list of assignments.
        // Put remaining jobs on an unassigned list.
        for (const job of jobs) {
            const cart = job.assignedTo;
            if (cart) {
                // This job is already assigned.
                // Unless there is a bug, we will always find cart in cartJobs.
                const cartJobs = existingAssignments.get(cart) as Job[];
                cartJobs.push(job);
            }
            else {
                // This job is not assigned.
                unassigned.push(job);
            }
        }

        // Examine every pairing of a Cart with a combination of 1 to N Jobs.
        // Exclude pairings that violate job scheduling constraints.
        // Then score each pairing.
        const alternatives: Assignment[] = [];
        for (const [cart, assigned] of existingAssignments) {
            if (assigned.length >= this.maxJobCount) {
                // The esisting assignment is the only possible plan for this cart.
                // Set score to Infinity.
                alternatives.push({
                    cart,
                    jobs: assigned,
                    score: Infinity
                });
            }
            else {
                const maxNewJobs = this.maxJobCount - assigned.length;
                for (let jobCount = 0; jobCount <= maxNewJobs; ++jobCount) {
                    // Issue: what if [ShortJob] is always a better score than [ShortJob, LongJob],
                    // even though LongJob will have to be done eventually?
                    // Perhaps we want to enumerate and select all 3-tuples and then
                    // only look at 2-tuples if there were some carts unassigned?
                    for (const combination of combinations(jobCount, unassigned.length)) {
                        const slate = [...assigned, ...(combination.map((n) => unassigned[n]))];
                        if (slate.length > 3) {
                            console.log(`slate has length of ${slate.length}`);
                        }
                        const plan = this.routePlanner.getBestRoute(cart, slate, time);
                        if (plan) {
                            alternatives.push({
                                cart,
                                jobs: slate,
                                score: plan.workingTime
                            })
                        }
                    }   
                }
            }
        }

        // Now we have all of the possible assignments.
        // Sort them by decreasing score.
        alternatives.sort((a, b) => b.score - a.score);

        // Use greedy algorithm to choose assignments, based on score.
        const assignments: Map<Cart, Assignment> = new Map<Cart, Assignment>();
        const assignedJobs: Set<Job> = new Set<Job>();
        const assignedCarts: Set<Cart> = new Set<Cart>();
        for (const alternative of alternatives) {
            const text = `[${alternative.jobs.map((x) => x.id).join(',')}]`;
            let conflicting = assignedCarts.has(alternative.cart);
            if (!conflicting) {
                for (const job of alternative.jobs) {
                    if (assignedJobs.has(job)) {
                        conflicting = true;
                        break;
                    }
                }
            }
            // console.log(`${conflicting?"CONFLICTING":"OK"}: ${text} (cart = ${alternative.cart.id}, score = ${alternative.score})`);
            if (!conflicting) {
                assignedCarts.add(alternative.cart);
                for (const job of alternative.jobs) {
                    assignedJobs.add(job);
                }
                assignments.set(alternative.cart, alternative);
            }
        }

        console.log('');
        console.log(`Searched ${alternatives.length} assignments`);
        console.log('');

        return assignments;
    }
}