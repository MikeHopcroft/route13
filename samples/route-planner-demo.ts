import { AnyJob, CartFactory, JobFactory, LocationId, RoutePlanner, SimTime } from '../src';


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
    const jobs: AnyJob[] = [
        // Move 5 items from location 2 to 10 between the times 300 and 3000.
        jobFactory.transfer(5, 2, 300, 10, 3000),

        // Move 5 items from location 3 to 4 between the times 300 and 3000.
        jobFactory.transfer(5, 3, 300, 4, 3000),

        // Go out of service at location 7 between the times 3000 and 4000.
        jobFactory.outOfService(7, 3000, 4000),
    ];

    // Planning route for the following cart:
    const cartFactory = new CartFactory();
    const cart = cartFactory.cart(10, 0);

    // Construct the planner.
    const planner = new RoutePlanner(maxJobs, loadTimeEstimator, unloadTimeEstimator, transitTimeEstimator, logger);

    // Plan starts at this time.
    const time = 0;
    
    // Find the best plan.
    // TODO: remove the slice.
    const plan = planner.getBestRoute(cart, jobs, time);

    console.log('#########################')
    console.log('Planning Complete');
    console.log('');

    if (plan) {
        planner.explainPlan(plan, time, logger);
    }
    else {
        console.log('No plan found.')
    }
}

go();
