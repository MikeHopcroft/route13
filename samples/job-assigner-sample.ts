import * as seedrandom from 'seedrandom';

import { Cart, CartFactory, Job, JobAssigner, LocationId, JobFactory, Plan, printPlan, RoutePlanner, SimTime } from '../src';

const random = seedrandom("seed");

function go() {
    const cartCount = 10;
    const cartCapacity = 10;
    const meanCartLoadFactor = 0.5;
    const jobCount = 50;
    const locationCount = 11;
    const meanStartTime = 1000;
    const slack = 100;    // Was 2
    const maxLookahead = 3;
    const startTime = 0;

    // Create some carts.
    console.log(`Creating ${cartCount} carts with capacity = ${cartCapacity}.`)
    const cartFactory = new CartFactory();
    const carts: Cart[] = [];
    for (let i = 0; i < cartCount; ++i) {
        // Create a cart, add it to the environment, and start a driver.
        const cart = randomlyPositionedCart(cartFactory, locationCount, cartCapacity);
        console.log(`    Cart ${cart.id} at location ${cart.lastKnownLocation} with capacity ${cart.capacity}`)
        carts.push(cart);
    }

    console.log('');

    // Create a set of random jobs.
    console.log(`Creating ${jobCount} transfer jobs.`)
    const jobFactory = new JobFactory();
    const jobs: Job[] = [];
    for (let i = 0; i < jobCount; ++i) {
        const job = randomTransitJob(
            jobFactory,
            locationCount,
            cartCapacity,
            meanCartLoadFactor,
            meanStartTime,
            slack
        );
        jobs.push(job);

        console.log(`    Job ${job.id}: move ${job.quantity} items from ${job.pickupLocation} to ${job.dropoffLocation} between ${job.pickupAfter} and ${job.dropoffBefore}`);
    }

    const assigner = new JobAssigner(
        maxLookahead,
        loadTimeEstimator,
        unloadTimeEstimator,
        transitTimeEstimator
    );

    const nullLogger = (s: string) => {};
    const routePlanner = new RoutePlanner(maxLookahead, loadTimeEstimator, unloadTimeEstimator, transitTimeEstimator, nullLogger);

    console.log('');

    console.log('=== Searching Job Assignments ===');
    const plannerStartTime = Date.now();
    const assignments = assigner.createAssignment(jobs[Symbol.iterator](), carts[Symbol.iterator](), startTime);
    const plannerEndTime = Date.now();

    console.log('');
    console.log('=== Job Assignment Completed ===');

    for (const [cart, assignment] of assignments) {
        console.log('------------------------------------------------------');
        console.log(`Cart ${cart.id}: [${assignment.jobs.map((x) => x.id).join(',')}]`);
        const plan = routePlanner.getBestRoute(cart, assignment.jobs, startTime) as Plan;
        // routePlanner.explainPlan(plan, 0, console.log);
        printPlan(plan);
    }

    console.log('');
    console.log(`Planning took ${(plannerEndTime - plannerStartTime)/1000} seconds.`)
}

// Creates a randomly positioned Cart.
function randomlyPositionedCart(
    factory: CartFactory,
    locationCount: number,
    capacity: number
) {
    return factory.cart(capacity, Math.floor(random() * locationCount))
}

// Generates a random TransitJob.
function randomTransitJob(
    factory: JobFactory,
    locationCount: number,
    cartCapacity: number,
    meanCartLoadFactor: number,
    meanStartTime: number,
    slack: number
) {
    // Choose a random start location.
    const start = Math.floor(random() * locationCount);

    // Choose a random non-zero distance to end location.
    const delta = Math.floor(random() * (locationCount - 2)) + 1;

    // We now have a random end location that differs from the start.
    const end = (start + delta) % locationCount;

    // Choose a random, non-zero quantity, the doesn't exceed cart capacity.
    const quantity = Math.floor(random() * meanCartLoadFactor * (cartCapacity - 1)) + 1;

    // Choose a random start time.
    const startTime = Math.floor(random() * meanStartTime);

    // End time is based on minimum job duration plus random slack.
    const minDuration =
        transitTimeEstimator(start, end, startTime) +
        loadTimeEstimator(start, quantity, startTime) +
        unloadTimeEstimator(end, quantity, startTime);
    const duration = Math.floor(minDuration * (1 + random() * slack));
    const endTime = startTime + duration;

    return factory.transfer(quantity, start, startTime, end, endTime);
}

///////////////////////////////////////////////////////////////////////////////
//
// Estimators provided to the simulation.
//
///////////////////////////////////////////////////////////////////////////////

// The transitTimeEstimator models a sequence of locations along a line.
// The travel time between two locations is just 100 time units per unit
// distance, where distance is expressed as the difference between LocationId
// values.
//
// So, for example, a freight terminal might have a row of loading docks with
// LocationId values in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]. The time to travel
// between dock 0 and dock 10 is 1000 time units.
//
// NOTE: this function can be generated from a directed graph, using the
// the Graph class in src/estimators.
function transitTimeEstimator(origin: LocationId, destination: LocationId, startTime: SimTime): SimTime {
    return Math.abs(destination - origin) * 100;
}

// This function gives the next location along the path from the specified
// origin to the destination.
//
// In the loading dock example, the path from dock 7 to dock 3 first goes
// through dock 6.
//
// NOTE: this function can be generated from a directed graph, using the
// the Graph class in src/estimators.
function routeNextStep(origin: LocationId, destination: LocationId) {
    if (origin < destination) {
        return origin + 1;
    }
    else if (origin > destination) {
        return origin - 1;
    }
    else {
        return origin;
    }
}

// The loadTimeEstimator models the time to load items onto a cart. Loading an
// item takes 5 units of time. 
function loadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 5 * quantity;
}

// The unloadTimeEstimator models the time to unload items from a cart.
// Unloading an item takes 2 units of time. 
function unloadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 2 * quantity;
}

///////////////////////////////////////////////////////////////////////////////
//
// Program entry point. Run the simulation!
//
///////////////////////////////////////////////////////////////////////////////
go();
