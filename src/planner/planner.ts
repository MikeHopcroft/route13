import { SimTime } from '../core';
import { Cart, Job } from '../environment';

export interface Assignment {
    cart: Cart,
    jobs: Job[],
    score: number
}

export interface Planner {
    createAssignment(
        jobs: IterableIterator<Job>,
        carts: IterableIterator<Cart>,
        time: SimTime
    ): Map<Cart, Assignment>;

    // estimatePlanningTime(): SimTime;
}

