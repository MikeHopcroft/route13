# Route13 

[![Build Status](https://travis-ci.com/MikeHopcroft/route13.svg?branch=master)](https://travis-ci.com/MikeHopcroft/route13)
[![npm version](https://badge.fury.io/js/route13.svg)](https://badge.fury.io/js/route13)

`Route13` is a framework for building simulators and optimizers for transportation networks. `Route13` includes a number of naive, brute-force and heuristics based optimizers, but its pluggable architecture allows the use of more sophisticated optimizers, such as 
[linear programming solvers](https://en.wikipedia.org/wiki/Linear_programming)
and ML models. `Route13` scenarios include forklifts in warehouses, baggage carts at airports, and trucks on highways. Basically anything that involves workers or equipment moving loads over a network while satisfying constraints around delivery times, equipment capacities, and worker schedules.

For information on how `Route13` works, please see our
[design documents](https://github.com/MikeHopcroft/route13/blob/master/documentation/README.md).

## Try Route13

`Route13` is a [Node.js](https://nodejs.org/en/) project,
written in [TypeScript](https://www.typescriptlang.org/).
In order to use `Route13` you must have
[Node installed](https://nodejs.org/en/download/) on your machine.
`Route13` has been tested with Node version 9.4.0.

`Route13` is be available as an [npm package](https://www.npmjs.com/package/route13). To install `Route13`,

~~~
% npm install route13
~~~

To run the samples, it is best to build `Route13` from sources. First, clone the [repo](https://github.com/MikeHopcroft/route13):
~~~
% git clone https://github.com/MikeHopcroft/route13.git
~~~

Then run the following commands from the root of the repo:

~~~
% cd route13
% npm install
% npm run compile
~~~

Unit tests are based on [Mocha](https://www.npmjs.com/package/mocha) and 
[Chai](https://www.npmjs.com/package/chai) and can be run with
~~~
% npm run test
~~~
### Running the Samples

`Route13` provides a number of [sample applications](./samples) that demonstrate various aspects of configuring and running simulations and optimizers.

* [Hello Route13](./documentation/samples/simulator.md) - shows how to configure and run a basic simulation.
* [Route Planning](./documentation/samples/route-planner.md) - demonstrates how to find the optimal route for a single `Cart` to perform a set of `Jobs`.
* [Graph](./documentation/samples/graph.md) - demonstrates the use of the [Floyd-Warshall algorithm](https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm)
 to find shortest paths and estimate travel times.
* [Job Assignment](./documentation/samples/job-assignment.md) - demonstrates use of a brute-force optimizer to assign a of `Jobs` to a pool of `Carts`.
* [Staffing Generator](./documentation/samples/staffing-generator.md) - example of a synthetic generator that produces `OutOfService` events
for a hypothetical workforce, consisting of multiple crews, each working a
specific shift.
* [Transfer Generator](./documentation/samples/transfer-generator.md) - example of a synthetic generator that produces `TransferJob` events
for a synthetic schedule of random arrivals and departures.

## Route13 Applications

Section coming soon.

## Using Route13

Section coming soon. For now, please see our 
[design documents](https://github.com/MikeHopcroft/route13/blob/master/documentation/README.md).

## Contributing to Route13.

Section coming soon.