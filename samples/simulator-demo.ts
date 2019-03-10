import {
    CartFactory,
    Clock,
    SimpleDispatcher,
    Driver,
    Environment,
    formatTimeHMS,
    Job,
    JobFactory,
    LocationId,
    MINUTE,
    // PlanningLoopDispatcher,
    SECOND,
    SimTime,
    start,
    TextTrace,
    time
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
    const trace = new TextTrace(clock, formatTimeHMS, console.log );

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

    // The Dispatcher class assigns Jobs to Drivers.
    // const dispatcher = new PlanningLoopDispatcher(clock, environment, trace, null);
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
    const jobFactory = new JobFactory();
    const jobs: Job[] = [
        // Move 5 items from location 2 to 10 between the times 0:03 and 0:30.
        jobFactory.transfer(5, 2, time(0,3), 10, time(0,30)),

        // Move 5 items from location 3 to 4 between the times 0:03 and 0:25.
        jobFactory.transfer(6, 3, time(0,3), 4, time(0,25)),

        // Go out of service at location 9 between the times 0:30 and 0:40.
        jobFactory.outOfService(9, time(0,30), time(0,40)),

        // Move 9 items from location 7 to 4 between the times 0:13 and 0:27.
        jobFactory.transfer(9, 7, time(0,13), 4, time(0,27))
    ];

    // Starting at time zero, make the dispatcher aware of all of the Jobs on
    // the list. In a real simulation, the jobs would likely trickle in,
    // one-by-one, over a period of time.
    const introduceAt: SimTime = 0;
    for (const job of jobs) {
        start(dispatcher.introduceJob(job, introduceAt));
    }

    // Start the dispatcher's planning loop.
    // This loop will run until the dispatcher is shut down.
    start(dispatcher.planningLoop());

    // Shut down the dispatcher at 0:59.
    start(dispatcher.shutdownAt(time(0, 59)));

    // Kick off the simulation.
    clock.mainloop();

    console.log('Simulation ended.');
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
    return Math.abs(destination - origin) * MINUTE;
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


///////////////////////////////////////////////////////////////////////////////
//
// Program entry point. Run the simulation!
//
///////////////////////////////////////////////////////////////////////////////
go();
