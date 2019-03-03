import { Cart, CartId, Job, JobId } from '../environement';

// Used at the beginning of a planning cycle.
// The cartSnapshot() function makes a copy of a set of Carts, indexed by CartId.
// The copied Carts are distinct from the originals.
function cartSnapshot(carts: IterableIterator<Cart>): Map<CartId, Cart> {
    const copy = new Map<CartId, Cart>();

    // Copy over the carts, indexing each by its id.
    // WARNING: This code is brittle because it relies on knowledge of
    // that all fields of Cart are primitive.
    for (const cart of carts) {
        copy.set(cart.id, {...cart});
    }

    return copy;
} 

// Used at the beginning of a planning cycle.
// The jobSnapshot() function makes a copy of a set of Jobs, indexed by JobId.
// As each job is copied, its assignedTo field, if not null, is replaced by the
// corresponding cart in `carts`. 
function jobSnapshot(carts: Map<CartId, Cart>, jobs: IterableIterator<Job>): Map<JobId, Job> {
    const copy = new Map<JobId, Job>();

    // Copy over jobs, indexing each by its id.
    // If assignedTo is set, use its copy.
    // WARNING: This code is brittle because it relies on knowledge of
    // which fields of Job are primitives.
    for (const job of jobs) {
        let assignedTo = null;
        if (job.assignedTo) {
            assignedTo = carts.get(job.assignedTo.id) as Cart;
        }
        copy.set(job.id, {...job, assignedTo});
    }

    return copy;
}

// Produces a new job assignment that is the merge of the existing assignment
// and a new assignment. During the merge, carts retain jobs to which they are
// currently assigned.
function merge(
    carts: Map<CartId, Cart>,
    jobs: Map<JobId, Job>,
    assignment: Map<CartId, JobId[]>
): Map<Cart, Job[]> {
    // Create an empty map to hold the merged assignment.
    const merged = new Map<Cart, Job[]>();

    // Make an entry for each cart.
    for (const [cartId, cart] of carts) {
        merged.set(cart, []);
    }

    // Any job that is currently assigned keeps its assignment.
    for (const [jobId, job] of jobs) {
        if (job.assignedTo) {
            (merged.get(job.assignedTo) as Job[]).push(job);
        }
    }

    // Now copy over the new assignments.
    for (const [cartId, jobIds] of assignment.entries()) {
        const cart = carts.get(cartId);
        if (!cart) {
            const message = `Unknown CartId ${cartId}`;
            throw TypeError(message);
        }
        else {
            for (const jobId of jobIds) {
                const job = jobs.get(jobId);
                if (!job) {
                    // This job is not longer active. Just discard it.
                }
                else {
                    // We've already copied those jobs that are assigned.
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
