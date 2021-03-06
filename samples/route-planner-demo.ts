import { CartFactory, Job, JobFactory, LocationId, RoutePlanner, SimTime, time } from '../src';

function transitTimeEstimator(origin: LocationId, destination: LocationId, startTime: SimTime): SimTime {
    return Math.abs(destination - origin) * 100;
}

function loadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 5 * quantity;
}

function unloadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 2 * quantity;
}


function go() {
    // Configure the planner to look at permutations of actions associated
    // with at most this many jobs.
    const maxJobs = 3;

    // Log planner output to console.
    const logger = console.log;

    // Planning route for the following jobs:
    const jobFactory = new JobFactory();
    const jobs: Job[] = [
        // Move 5 items from location 2 to 10 between the times 300 and 3000.
        jobFactory.transfer(5, 2, time(0,3), 10, time(0,30)),

        // Move 4 items from location 3 to 4 between the times 300 and 3000.
        jobFactory.transfer(4, 3, time(0,3), 4, time(0,30)),

        // Go out of service at location 7 between the times 3000 and 4000.
        jobFactory.outOfService(9, time(0,30), time(0,40)),
    ];

    // Planning route for the following cart:
    const cartFactory = new CartFactory();
    const cart = cartFactory.cart(10, 0);

    // Construct the planner.
    const planner = new RoutePlanner(maxJobs, loadTimeEstimator, unloadTimeEstimator, transitTimeEstimator, logger);

    // Route starts at this time.
    const startTime = 0;
    
    // Find the best plan.
    // TODO: remove the slice.
    const plan = planner.getBestRoute(cart, jobs, startTime);

    console.log('#########################')
    console.log('Route planning Complete');
    console.log('');

    if (plan) {
        planner.explainRoute(plan, startTime, logger);
    }
    else {
        console.log('No route found.')
    }
}

go();
