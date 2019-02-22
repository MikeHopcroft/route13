import { AnyJob, Cart, LocationId, SimTime } from '../src/types';
import { Agent, Clock, Dispatcher, Environment, JobFactory, resume, TextTrace } from '../src';

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
//     Assigned jobs to workers.
//   Agent
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
    const trace = new TextTrace(clock, console.log );

    // The Environment class holds the state of the world. This state includes
    //   1. estimator functions that model physical activities in the world,
    //      e.g. the time required to move from one place to another, the time
    //      needed to load items onto a cart, etc.
    //   2. locations of items like Carts and their capacities and current
    //      payloads.
    //   3. status of known Jobs, e.g. moving items from place to place within
    //      a certain time window, going out of service for 15 minutes to
    //      refuel, etc.
    const env = new Environment(
        loadTimeEstimator,
        unloadTimeEstimator,
        routeNextStep,
        transitTimeEstimator,
        trace
    );

    // The Dispatcher class assigns Jobs to workers.
    const dispatcher = new Dispatcher(clock, env);

    // The Agent issues the commands that perform jobs that have been assigned.
    const agent = new Agent(clock, dispatcher, env, trace);

    // Have the agent spin up 3 new workers, each with a cart.
    const cartCount = 3;
    for (let i = 0; i < cartCount; ++i) {
        // Create a cart.
        const cart: Cart = {
            id: i,
            capacity: 10,
            payload: 0,
            lastKnownLocation: 0
        };

        // Start an worker for this cart.
        resume(agent.newWorker(cart));
    }

    // Construct a list of jobs.
    const factory = new JobFactory();
    const jobs: AnyJob[] = [
        // Move 5 items from location 2 to 10 between the times 300 and 3000.
        factory.transfer(5, 2, 300, 10, 3000),

        // Move 5 items from location 3 to 4 between the times 300 and 3000.
        factory.transfer(5, 3, 300, 4, 3000),

        // Go out of service at location 7 between the times 3000 and 4000.
        factory.outOfService(7, 3000, 4000),

        // Move 7 items from location 8 to 4 between the times 1300 and 3000.
        factory.transfer(7, 8, 1300, 4, 3000)
    ];

    // Make the dispatcher aware the Jobs.
    for (const job of jobs) {
        // TODO: uniform method to know job starting time.
        // For now, introduce all jobs at time 0.
        resume(dispatcher.introduceJob(job, 0));
    }

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

// Run the simulation!
go();
