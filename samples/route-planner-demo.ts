import { RoutePlanner } from '../src/planner';
import { Cart, LocationId, SimTime } from '../src/types';
import { AnyJob, JobType, OutOfServiceJob, OutOfServiceJobState, TransferJob, TransferJobState } from '../src/types';


function transitTimeEstimator(origin: LocationId, destination: LocationId, startTime: SimTime): SimTime {
    return Math.abs(destination - origin) * 100;
}

function loadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 5 * quantity;
}

function unloadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 2 * quantity;
}

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
    } as TransferJob,
    {
        id: 3,
        type: JobType.OUT_OF_SERVICE,
        assignedTo: null,

        state: OutOfServiceJobState.BEFORE_BREAK,
        suspendLocation: 7,
        suspendTime: 3000,
        resumeTime: 4000
    } as OutOfServiceJob
];


function go() {
    // Configure the planner to look at permutations of actions associated
    // with at most this many jobs.
    const maxJobs = 3;

    // Log planner output to console.
    const logger = console.log;

    // Construct the planner.
    const planner = new RoutePlanner(maxJobs, loadTimeEstimator, unloadTimeEstimator, transitTimeEstimator, logger);

    // Planning route for this cart.
    const cart: Cart = {
        id: 1,
        capacity: 10,
        payload: 0,
        lastKnownLocation: 0
    };

    // Plan starts at this time.
    const time = 0;
    
    // Find the best plan.
    const plan = planner.getBestRoute(cart, jobs.slice(0,3), time);

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
