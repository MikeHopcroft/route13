# Route13 [![Build Status](https://travis-ci.com/MikeHopcroft/TokenFlow.svg?branch=master)](https://travis-ci.com/MikeHopcroft/TokenFlow)

`Route13` is a framework for building simulators and optimizers for transportation networks. `Route13` includes a number of naive, brute-force and heuristics based optimizers, but its pluggable architecture allows the use of more sophisticated optimizers, such as 
[linear programming solvers](https://en.wikipedia.org/wiki/Linear_programming)
and ML models. `Route13` scenarios include forklifts in warehouses, baggage carts at airports, and trucks on highways. Basically anything that involves workers or equipment moving loads over a network while satisfying constraints around delivery times, equipment capacities, and worker schedules.

For information on how `Route13` works, please see our
[design documents](https://github.com/MikeHopcroft/route13/tree/master/documentationREADME.md).

## Try Route13

`Route13` is a [Node.js](https://nodejs.org/en/) project,
written in [TypeScript](https://www.typescriptlang.org/).
In order to use `Route13` you must have
[Node installed](https://nodejs.org/en/download/) on your machine.
`Route13` has been tested with Node version 9.4.0.

`Route13` will be available as an npm package. To install `Route13`,

~~~
% npm install route13
~~~

To run the samples, it is best to build `Route13` from sources. First, clone the [repo](https://github.com/MikeHopcroft/airport) . Then run the following commands:

~~~
% npm install
% npm run compile
~~~

Unit tests are based on [Mocha](https://www.npmjs.com/package/mocha) and 
[Chai](https://www.npmjs.com/package/chai) and can be run with
~~~
% npm run test
~~~

### Simulator Sample

This sample models a simple environment with 11 locations, uniformly spaced along a line. At time zero, there are 3 carts, each positioned at location 0. We start the simulation with the following jobs:

* `Job 0`: Move 5 items from location 2 to 10 between the times 300 and 3000.
* `Job 1`: Move 5 items from location 3 to 4 between the times 300 and 3000.
* `Job 2`: Go out of service at location 7 between the times 3000 and 4000.
* `Job 3`: Move 7 items from location 8 to 4 between the times 1300 and 3000.

This simulator makes use of a `Dispatcher` that is configured to assign jobs randomly to carts as the carts become available.

The simulator is configured with a TextTrace object that logs status to the
console.

~~~
% node build/samples/simulator-demo.js

0: Job 0 assigned to cart 0.
0: Cart 0 departs location 0 for location 2.
0: Job 3 assigned to cart 1.
0: Cart 1 departs location 0 for location 8.
0: Job 1 assigned to cart 2.
0: Cart 2 departs location 0 for location 3.
100: Cart 2 passes location 1.
100: Cart 1 passes location 1.
100: Cart 0 passes location 1.
200: Cart 1 passes location 2.
200: Cart 0 arrives at location 2.
200: Cart 0 waits until 300.
200: Cart 2 passes location 2.
300: Cart 0 begins loading 5 items.
300: Cart 2 arrives at location 3.
300: Cart 2 begins loading 5 items.
300: Cart 1 passes location 3.
325: Cart 2 finishes loading (payload=5).
325: Cart 2 departs location 3 for location 4.
325: Cart 0 finishes loading (payload=5).
325: Cart 0 departs location 2 for location 10.
400: Cart 1 passes location 4.
425: Cart 0 passes location 3.
425: Cart 2 arrives at location 4.
425: Cart 2 begins unloading 5 items.
435: Cart 2 finishes unloading (payload=0).
435: Job 1 succeeded.
435: Job 2 assigned to cart 2.
435: Cart 2 departs location 4 for location 7.
500: Cart 1 passes location 5.
525: Cart 0 passes location 4.
535: Cart 2 passes location 5.
600: Cart 1 passes location 6.
625: Cart 0 passes location 5.
635: Cart 2 passes location 6.
700: Cart 1 passes location 7.
725: Cart 0 passes location 6.
735: Cart 2 arrives at location 7.
735: Cart 2 suspends service at location 7.
735: Cart 2 waits until 4000.
800: Cart 1 arrives at location 8.
800: Cart 1 waits until 1300.
825: Cart 0 passes location 7.
925: Cart 0 passes location 8.
1025: Cart 0 passes location 9.
1125: Cart 0 arrives at location 10.
1125: Cart 0 begins unloading 5 items.
1135: Cart 0 finishes unloading (payload=0).
1135: Job 0 succeeded.
1300: Cart 1 begins loading 7 items.
1335: Cart 1 finishes loading (payload=7).
1335: Cart 1 departs location 8 for location 4.
1435: Cart 1 passes location 7.
1535: Cart 1 passes location 6.
1635: Cart 1 passes location 5.
1735: Cart 1 arrives at location 4.
1735: Cart 1 begins unloading 7 items.
1749: Cart 1 finishes unloading (payload=0).
1749: Job 3 succeeded.
4000: Job 2 succeeded.
4000: Cart 2 resumes service at location 7.
Simulation ended.
~~~

### Route Planning Sample
This sample demonstrates route planning for a single `Cart`. In this case the
`Dispatcher` has assigned the following jobs to a `Cart`:

* `Job 0`: Move 5 items from location 2 to 10 between the times 300 and 3000.
* `Job 1`: Move 5 items from location 3 to 4 between the times 300 and 3000.
* `Job 2`: Go out of service at location 7 between the times 3000 and 4000.

We would like to determine ordering of pickups and dropoffs that minimizes working time.

The `RoutePlanner` has been configured to print out those plans it considered,
but rejected because they violated constraints. The sample prints the optimal
plan at the end.

~~~
=================
Failed:

Plan for cart 0 (working time = 2260):
PICKUP 5 bags at gate 2 after 300 (job 0)
    0: drive for 200s to gate 2
    200: wait 100s until 300
    300: load 5 bags in 25s.
    325: completed
DROPOFF 5 bags at gate 10 before 3000 (job 0)
    325: drive for 800s to gate 10
    1125: unload 5 bags in 10s.
    1135: completed
PICKUP 5 bags at gate 3 after 300 (job 1)
    1135: drive for 700s to gate 3
    1835: load 5 bags in 25s.
    1860: completed
SUSPEND at gate 7 before 3000 until 4000 (job 2)
    1860: drive for 400s to gate 7
    2260: suspend operations
    2260: wait 1740s until 4000
    4000: resume operations
    4000: completed
DROPOFF 5 bags at gate 4 before 3000 (job 1)
    4000: drive for 300s to gate 4
    4300: unload 5 bags in 10s.
    4310: CONTRAINT VIOLATED - dropoff after deadline 3000

=================
Failed:

Plan for cart 0 (working time = 1860):
PICKUP 5 bags at gate 2 after 300 (job 0)
    0: drive for 200s to gate 2
    200: wait 100s until 300
    300: load 5 bags in 25s.
    325: completed
DROPOFF 5 bags at gate 10 before 3000 (job 0)
    325: drive for 800s to gate 10
    1125: unload 5 bags in 10s.
    1135: completed
SUSPEND at gate 7 before 3000 until 4000 (job 2)
    1135: drive for 300s to gate 7
    1435: suspend operations
    1435: wait 2565s until 4000
    4000: resume operations
    4000: completed
PICKUP 5 bags at gate 3 after 300 (job 1)
    4000: drive for 400s to gate 3
    4400: load 5 bags in 25s.
    4425: completed
DROPOFF 5 bags at gate 4 before 3000 (job 1)
    4425: drive for 100s to gate 4
    4525: unload 5 bags in 10s.
    4535: CONTRAINT VIOLATED - dropoff after deadline 3000

=================
Failed:

... 13 more failed plans ...

=================
Failed:

Plan for cart 0 (working time = 1125):
SUSPEND at gate 7 before 3000 until 4000 (job 2)
    0: drive for 700s to gate 7
    700: suspend operations
    700: wait 3300s until 4000
    4000: resume operations
    4000: completed
PICKUP 5 bags at gate 3 after 300 (job 1)
    4000: drive for 400s to gate 3
    4400: load 5 bags in 25s.
    4425: completed
DROPOFF 5 bags at gate 4 before 3000 (job 1)
    4425: drive for 100s to gate 4
    4525: unload 5 bags in 10s.
    4535: CONTRAINT VIOLATED - dropoff after deadline 3000

Considered 16 failed plans.
Considered 3 successful plans.

#########################
Planning Complete

Plan for cart 0 (working time = 1470):
PICKUP 5 bags at gate 2 after 300 (job 0)
    0: drive for 200s to gate 2
    200: wait 100s until 300
    300: load 5 bags in 25s.
    325: completed
PICKUP 5 bags at gate 3 after 300 (job 1)
    325: drive for 100s to gate 3
    425: load 5 bags in 25s.
    450: completed
DROPOFF 5 bags at gate 4 before 3000 (job 1)
    450: drive for 100s to gate 4
    550: unload 5 bags in 10s.
    560: completed
DROPOFF 5 bags at gate 10 before 3000 (job 0)
    560: drive for 600s to gate 10
    1160: unload 5 bags in 10s.
    1170: completed
SUSPEND at gate 7 before 3000 until 4000 (job 2)
    1170: drive for 300s to gate 7
    1470: suspend operations
    1470: wait 2530s until 4000
    4000: resume operations
    4000: completed
~~~

### Graph Sample

The `Graph` class uses the [Floyd-Warshall algorithm](https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm)
to compute travel times and
paths through a directed graph with weighted edges. The `Graph.cost()` and
`Graph.next()` methods can be used to supply the `TransitTimeEstimator` and
`RouteNextStep` parameters to the `Environment` constructor.

This sample demonstrates the algorithm on a small graph with the following edges:
* { from: 0, to: 2, weight: -2}
* { from: 1, to: 0, weight: 4}
* { from: 1, to: 2, weight: 3}
* { from: 2, to: 3, weight: 2}
* { from: 3, to: 1, weight: -1}

The sample outputs the `Graph.distances` matrix, the `Graph.next` matrix, and
the shortest paths between all pairs of vertices.

~~~
% node build/samples/graph-demo.js

=== Iteration 0 ===
Distances
0: 0, -1, -2, 0
1: 4, 0, 2, 4
2: 5, 1, 0, 2
3: 3, -1, 1, 0

Next
0: x 2 2 2
1: 0 x 0 0
2: 3 3 x 3
3: 1 1 1 x

0 => 0: []
0 => 1: [2,3,1]
0 => 2: [2]
0 => 3: [2,3]
1 => 0: [0]
1 => 1: []
1 => 2: [0,2]
1 => 3: [0,2,3]
2 => 0: [3,1,0]
2 => 1: [3,1]
2 => 2: []
2 => 3: [3]
3 => 0: [1,0]
3 => 1: [1]
3 => 2: [1,0,2]
3 => 3: []
~~~


