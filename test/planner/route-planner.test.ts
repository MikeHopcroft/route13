import { assert } from 'chai';
import 'mocha';

import { SimTime } from '../../src/core';
import { CartFactory, JobFactory, LocationId } from '../../src/environment';
import { RoutePlanner } from '../../src/planner';
import { Job } from '../../src/environment';

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
    it('RoutePlanner', () => {

        const cartFactory = new CartFactory();
        const cart = cartFactory.cart(10, 0);

        const jobFactory = new JobFactory();
        const jobs: Job[] = [
            jobFactory.transfer(5, 2, 300, 10, 3000),
            jobFactory.transfer(5, 3, 300, 4, 3000)
        ];

        const time = 0;

        planner.getBestRoute(cart, jobs, time);

        // TODO: Finish implementing this unit test.
        // Right now we only verify that the code does not crash.
    });
});
