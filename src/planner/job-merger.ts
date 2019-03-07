import { Cart, CartId, Job, JobId } from '../environement';
import { Assignment } from '../planner';


// Produces a new job assignment that is the merge of the existing assignment
// and a new assignment. During the merge, carts retain jobs to which they are
// currently assigned.
//
// The merge step is necessary because Carts can do work while the new Job
// assignment is being generated. By the time the new Job assignment becomes
// available, the state of the Environment may have changed in a way that
// invalidates aspects of the plan.
//
// As an example, a Cart could start a Job that the Plan assigned to a
// a different Cart. Or the Plan could assign a Job that is found to have
// already been completed by the time the Plan becomes available.
//
// Parameters:
//
// carts
//   Map of Carts managed by the Environment
// jobs
//   Map of Jobs known to the Environment
// assignment
//   Provides a mapping from each Cart to the list of Jobs it should perform.
//
export function merge2(
    carts: Map<CartId, Cart>,
    jobs: Map<JobId, Job>,
    plan: Map<Cart, Assignment>
): Map<Cart, Job[]> {
    // Create an empty map to hold the merged assignment.
    const merged = new Map<Cart, Job[]>();

    // Make an entry for each cart.
    for (const cart of carts.values()) {
        merged.set(cart, []);
    }

    // Any job that is currently assigned keeps its assignment.
    for (const job of jobs.values()) {
        if (job.assignedTo) {
            (merged.get(job.assignedTo) as Job[]).push(job);
        }
    }

    // Now copy over the new assignments.
    for (const assignment of plan.values()) {
        const cart = carts.get(assignment.cart.id);
        if (!cart) {
            const message = `Unknown CartId ${assignment.cart.id}`;
            throw TypeError(message);
        }
        else {
            for (const j of assignment.jobs) {
                const job = jobs.get(j.id);
                if (!job) {
                    // This job is not longer active. Just discard it.
                }
                else {
                    // We've already copied those jobs that are currently assigned.
                    // Therefore only copy those that haven't been assigned.
                    if (!job.assignedTo) {
                        (merged.get(cart) as Job[]).push(job);
                    }
                }
            }
        }
    }
    return merged;
}
