import { Job, Cart, CartId } from '../environement';

class JobAssigner {
    createAssignment(jobs: IterableIterator<Job>, carts: IterableIterator<Cart>): Map<CartId, Job[]> {
        const assignment = new Map<CartId, Job[]>();

        // First add all of the in-progress jobs to the assignment.

        // For each partial assignment, generate combinations of feasible full assignments.
        // Add these assignments to priority queue based on score.
        // Also add these assignments to map from JobId to Assignment[].

        return assignment;
    }
}