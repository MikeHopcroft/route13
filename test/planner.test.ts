import { assert } from 'chai';
import 'mocha';

import { AnyJob, buildTrie, Cart, Job, JobType, LocationId, SimTime, RoutePlanner, TransferJob, TransferJobState } from '../src/planner/';

function transitTimeEstimator(origin: LocationId, destination: LocationId, startTime: SimTime): SimTime {
    return Math.abs(destination - origin) * 100;
}

function loadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 5 * quantity;
}

function unloadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 2 * quantity;
}

const planner = new RoutePlanner(3, loadTimeEstimator, unloadTimeEstimator, transitTimeEstimator);

describe('planner', () => {
    it('sample', () => {

        const cart: Cart = {
            id: 1,
            capacity: 10,
            payload: 0,
            lastKnownLocation: 0
        };

        const jobs: AnyJob[] = [
            {
                id: 1,
                type: JobType.TRANSFER,
                assignedTo: null,

                state: TransferJobState.BEFORE_PICKUP,
                quantity: 5,
                pickupLocation: 2,
                pickupAfter: 300,
                dropoffLocation: 10,
                dropoffBefore: 3000

            } as TransferJob,
            {
                id: 2,
                type: JobType.TRANSFER,
                assignedTo: null,

                state: TransferJobState.BEFORE_PICKUP,
                quantity: 5,
                pickupLocation: 3,
                pickupAfter: 300,
                dropoffLocation: 4,
                dropoffBefore: 3000
            } as TransferJob
        ];

        const time = 0;

        planner.getBestRoute(cart, jobs, time);

        console.log('hello');
    });
});
