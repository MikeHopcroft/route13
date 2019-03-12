import {
    CartFactory,
    Clock,
    SimpleDispatcher,
    Driver,
    Environment,
    formatTimeHMS,
    HOUR,
    LocationId,
    MINUTE,
    PlanningLoopDispatcher,
    SECOND,
    SimTime,
    start,
    TextTrace,
    time,
    TransferGenerator,
    JobAssigner
} from '../src';

///////////////////////////////////////////////////////////////////////////////
//
// The Simulation
//
// Key components
//   Clock
//     Priority queue of events that drive the simulation.
//   Environment
//     Maintains the state of the world.
//   Dispatcher
//     Assigns jobs to Drivers.
//   Driver
//     Issues commands that perform jobs.
//
///////////////////////////////////////////////////////////////////////////////
function go() {
    // The Clock class generates the events that drive the simulation.
    const clock = new Clock();

    // Set up a TextTrace configured to log simulator activities to the console.
    // Trace output lines consist of the time, followed by a description of the
    // activity. For readability, lines associated with the same Cart have the
    // same color.
    const trace = new TextTrace(clock, formatTimeHMS, console.log);

    // The Environment class holds the state of the world. This state includes
    //   1. estimator functions that model physical activities in the world,
    //      e.g. the time required to move from one place to another, the time
    //      needed to load items onto a cart, etc.
    //   2. locations of items like Carts and their capacities and current
    //      payloads.
    //   3. status of known Jobs, e.g. moving items from place to place within
    //      a certain time window, going out of service for 15 minutes to
    //      refuel, etc.
    const environment = new Environment(
        loadTimeEstimator,
        unloadTimeEstimator,
        routeNextStep,
        transitTimeEstimator,
        trace
    );

    const maxJobCount = 3;
    const planner = new JobAssigner(
        maxJobCount,
        loadTimeEstimator,
        unloadTimeEstimator,
        transitTimeEstimator);

    // The Dispatcher class assigns Jobs to Drivers.
    const planningStartTime = time(7, 45);  // 7:45
    const planningInterval = time(0, 15);    // 0:05
    const dispatcher2 = new PlanningLoopDispatcher(
        clock,
        environment,
        trace,
        planningStartTime,
        planningInterval,
        planner
    );
    const dispatcher = new SimpleDispatcher(clock, environment, trace);

    // The Driver performs the sequence of Actions necessary to complete the
    // set of assigned Jobs.
    const driver = new Driver(clock, dispatcher, environment, trace);

    //
    // Create 3 carts
    //
    const cartFactory = new CartFactory();
    const cartCount = 3;
    for (let i = 0; i < cartCount; ++i) {
        // Create a cart, add it to the environment, and start a driver.
        const cart = cartFactory.cart(10, 0);
        environment.addCart(cart);
        start(driver.drive(cart));
    }

    //
    // Construct a list of jobs.
    //
    const arrivalCount = 20;
    const earliestArrivalTime = time(8, 0);     //  8:00
    const latestArrivalTime = time(22, 59);     // 22:59
    const turnAroundTime = 1 * HOUR;
    const minConnectionTime = 30 * MINUTE;
    const maxItemsPerTransfer = 5;
    const transfers = new TransferGenerator(
        arrivalCount,
        earliestArrivalTime,
        latestArrivalTime,
        turnAroundTime,
        minConnectionTime,
        maxItemsPerTransfer
    );

    // Print out list of jobs
    let lastBerth = undefined;
    for (const turnAround of transfers.getTurnArounds()) {
        const arrival = turnAround.arrival;
        if (arrival.location !== lastBerth) {
            console.log('');
            console.log(`Berth ${arrival.location}`);
            lastBerth = arrival.location;
        }
        const departure = turnAround.departure;
        console.log(`  Inbound #${arrival.id} at ${formatTime(arrival.time)} => Outbound #${departure.id} at ${formatTime(departure.time)}`)
        for (const job of turnAround.jobs) {
            const transferTime = job.dropoffBefore - job.pickupAfter;
            console.log(`    Job ${job.id}: move ${job.quantity} items from ${job.pickupLocation} to ${job.dropoffLocation} between ${formatTime(job.pickupAfter)} and ${formatTime(job.dropoffBefore)} (${formatTime(transferTime)})`);
        }
    }
    console.log('');


    // Make the dispatcher aware of each of the Jobs on the list, 15 minutes in
    // advance.
    for (const job of transfers.jobs()) {
        const introduceAt = Math.max(job.pickupAfter - 15 * MINUTE, 0);
        start(dispatcher.introduceJob(job, introduceAt));
    }

    // Start the dispatcher's planning loop.
    // This loop will run until the dispatcher is shut down.
    start(dispatcher.planningLoop());

    // Shut down the dispatcher at 23:59.
    start(dispatcher.shutdownAt(time(23, 59)));

    // Kick off the simulation.
    clock.mainloop();

    console.log(`Scheduled: ${transfers.getJobCount()} jobs`);
    console.log(`Completed: ${environment.successfulJobs.length}`);
    const failedJobs = environment.failedJobs.map( (x)=>x.id ).join(',');
    console.log(`Failed: ${environment.failedJobs.length} jobs`);
    if (environment.failedJobs.length > 0) {
        console.log(`  [${failedJobs}]`)
    }

    console.log('Simulation ended.');
}


///////////////////////////////////////////////////////////////////////////////
//
// Estimators provided to the simulation.
//
///////////////////////////////////////////////////////////////////////////////

// The transitTimeEstimator models a sequence of locations along a line.
// The travel time between two locations is just one minute per unit distance,
// where distance is expressed as the difference between LocationId values.
//
// So, for example, a freight terminal might have a row of loading docks with
// LocationId values in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]. The time to travel
// between dock 0 and dock 10 is 10 minutes.
//
// NOTE: this function can be generated from a directed graph, using the
// the Graph class in src/estimators.
function transitTimeEstimator(origin: LocationId, destination: LocationId, startTime: SimTime): SimTime {
    return Math.abs(destination - origin) * MINUTE * 10;
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
    return 30 * SECOND * quantity;
}

// The unloadTimeEstimator models the time to unload items from a cart.
// Unloading an item takes 2 units of time. 
function unloadTimeEstimator(location: LocationId, quantity: number, startTime: SimTime): SimTime {
    return 10 * SECOND * quantity;
}

function formatTime(time: SimTime) {
    const x = new Date(time);
    return x.toISOString().slice(-13,-8);
}

///////////////////////////////////////////////////////////////////////////////
//
// Program entry point. Run the simulation!
//
///////////////////////////////////////////////////////////////////////////////
go();
