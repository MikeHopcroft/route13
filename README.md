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

To run the samples, it is best to build `Route13` from sources. First, clone the [repo](https://github.com/MikeHopcroft/airport) . Then run the following commands from the root of the repo:

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

The simulator is configured with a `TextTrace` object that logs status to the console. Each status line starts with the simulator time, followed by a brief activity description.

~~~
% node build/samples/simulator-demo.js

0: Planning cycle started.
0: Job 0 assigned to cart 0.
0: Cart 0 departs location 0 for location 2.
0: Job 1 assigned to cart 1.
0: Cart 1 departs location 0 for location 3.
0: Job 3 assigned to cart 2.
0: Cart 2 departs location 0 for location 8.
100: Cart 2 passes location 1.
100: Cart 0 passes location 1.
100: Cart 1 passes location 1.
200: Cart 0 arrives at location 2.
200: Cart 0 waits until 300.
200: Cart 1 passes location 2.
200: Cart 2 passes location 2.
300: Cart 1 arrives at location 3.
300: Cart 1 begins loading 5 items.
300: Cart 2 passes location 3.
300: Cart 0 begins loading 5 items.
325: Cart 1 finishes loading (payload=5).
325: Cart 1 departs location 3 for location 4.
325: Cart 0 finishes loading (payload=5).
325: Cart 0 departs location 2 for location 10.
400: Cart 2 passes location 4.
425: Cart 0 passes location 3.
425: Cart 1 arrives at location 4.
425: Cart 1 begins unloading 5 items.
435: Cart 1 finishes unloading (payload=0).
435: Job 1 succeeded.
435: Job 2 assigned to cart 1.
435: Cart 1 departs location 4 for location 7.
500: Cart 2 passes location 5.
525: Cart 0 passes location 4.
535: Cart 1 passes location 5.
600: Cart 2 passes location 6.
625: Cart 0 passes location 5.
635: Cart 1 passes location 6.
700: Cart 2 passes location 7.
725: Cart 0 passes location 6.
735: Cart 1 arrives at location 7.
735: Cart 1 suspends service at location 7.
735: Cart 1 waits until 4000.
800: Cart 2 arrives at location 8.
800: Cart 2 waits until 1300.
825: Cart 0 passes location 7.
925: Cart 0 passes location 8.
1025: Cart 0 passes location 9.
1125: Cart 0 arrives at location 10.
1125: Cart 0 begins unloading 5 items.
1135: Cart 0 finishes unloading (payload=0).
1135: Job 0 succeeded.
1300: Cart 2 begins loading 7 items.
1335: Cart 2 finishes loading (payload=7).
1335: Cart 2 departs location 8 for location 4.
1435: Cart 2 passes location 7.
1535: Cart 2 passes location 6.
1635: Cart 2 passes location 5.
1735: Cart 2 arrives at location 4.
1735: Cart 2 begins unloading 7 items.
1749: Cart 2 finishes unloading (payload=0).
1749: Job 3 succeeded.
4000: Cart 1 resumes service at location 7.
4000: Job 2 succeeded.
5000: Planning cycle finished.
5000: Planning cycle started.
10000: Planning cycle finished.
10000: Planning cycle started.
15000: Planning cycle finished.
15000: Planning cycle started.
20000: Planning cycle finished.
Simulation ended.
~~~

### Route Planning Sample
This sample demonstrates route planning for a single `Cart`. In this case the
`Dispatcher` has assigned the following jobs to a `Cart`:

* `Job 0`: Move 5 items from location 2 to 10 between the times 300 and 3000.
* `Job 1`: Move 5 items from location 3 to 4 between the times 300 and 3000.
* `Job 2`: Go out of service at location 7 between the times 3000 and 4000.

We would like to determine ordering of pickups and dropoffs that minimizes working time.

In this sample, the `RoutePlanner` has been configured to print out those plans it considered.
Failed plans are those that were rejected because they violated constraints, such as
delivery deadlines and cart capacities. Successful plans are given a score that represents
the rate at which the plan moves items (items unloaded per unit working time).

~~~
=================
Succeeded:

Plan for cart 0 (working time = 2270, score = 0.004405286343612335):
PICKUP 5 items at location 2 after 300 (job 0)
    0: drive for 200s to location 2
    200: wait 100s until 300
    300: load 5 items in 25s.
    325: completed
DROPOFF 5 items at location 10 before 3000 (job 0)
    325: drive for 800s to location 10
    1125: unload 5 items in 10s.
    1135: completed
PICKUP 5 items at location 3 after 300 (job 1)
    1135: drive for 700s to location 3
    1835: load 5 items in 25s.
    1860: completed
DROPOFF 5 items at location 4 before 3000 (job 1)
    1860: drive for 100s to location 4
    1960: unload 5 items in 10s.
    1970: completed
SUSPEND at location 7 before 3000 until 4000 (job 2)
    1970: drive for 300s to location 7
    2270: suspend operations
    2270: wait 1730s until 4000
    4000: resume operations
    4000: completed

=================
Failed:

Plan for cart 0 (working time = 2260, score = 0):
PICKUP 5 items at location 2 after 300 (job 0)
    0: drive for 200s to location 2
    200: wait 100s until 300
    300: load 5 items in 25s.
    325: completed
DROPOFF 5 items at location 10 before 3000 (job 0)
    325: drive for 800s to location 10
    1125: unload 5 items in 10s.
    1135: completed
PICKUP 5 items at location 3 after 300 (job 1)
    1135: drive for 700s to location 3
    1835: load 5 items in 25s.
    1860: completed
SUSPEND at location 7 before 3000 until 4000 (job 2)
    1860: drive for 400s to location 7
    2260: suspend operations
    2260: wait 1740s until 4000
    4000: resume operations
    4000: completed
DROPOFF 5 items at location 4 before 3000 (job 1)
    4000: drive for 300s to location 4
    4300: unload 5 items in 10s.
    4310: CONTRAINT VIOLATED - dropoff after deadline 3000

=================

... 14 more failed plans and 2 more successful plans ...

=================
Failed:

Plan for cart 0 (working time = 1125, score = 0):
SUSPEND at location 7 before 3000 until 4000 (job 2)
    0: drive for 700s to location 7
    700: suspend operations
    700: wait 3300s until 4000
    4000: resume operations
    4000: completed
PICKUP 5 items at location 3 after 300 (job 1)
    4000: drive for 400s to location 3
    4400: load 5 items in 25s.
    4425: completed
DROPOFF 5 items at location 4 before 3000 (job 1)
    4425: drive for 100s to location 4
    4525: unload 5 items in 10s.
    4535: CONTRAINT VIOLATED - dropoff after deadline 3000


Considered 16 failed plans.
Considered 3 successful plans.
#########################
Planning Complete

Plan for cart 0 (working time = 1470, score = 0.006802721088435374):
PICKUP 5 items at location 2 after 300 (job 0)
    0: drive for 200s to location 2
    200: wait 100s until 300
    300: load 5 items in 25s.
    325: completed
PICKUP 5 items at location 3 after 300 (job 1)
    325: drive for 100s to location 3
    425: load 5 items in 25s.
    450: completed
DROPOFF 5 items at location 4 before 3000 (job 1)
    450: drive for 100s to location 4
    550: unload 5 items in 10s.
    560: completed
DROPOFF 5 items at location 10 before 3000 (job 0)
    560: drive for 600s to location 10
    1160: unload 5 items in 10s.
    1170: completed
SUSPEND at location 7 before 3000 until 4000 (job 2)
    1170: drive for 300s to location 7
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

### Job Assignment Sample

The `JobAssigner` class performs a brute force search of
assignments of tuples of `Jobs` to `Carts`. It filters out those
assignments that fail to satisfy constraints
(e.g. those that exceed cart capacities or fail to meet delivery deadlines). Remaining assignments are then scored by the number
of items delivered per unit of working time. A greedy algorithm 
is then used to pick a non-conflicting subset of assignments.
Two assignments are considered to conflict if they
share either `Jobs` or `Carts`.

The run, below, examines assignments consisting of of one, two, or three jobs. It ends up assigning three jobs to `Carts` 1, 2, and 4, and one job to `Cart 3`.
There is room for improvement here because `Cart` 5 was left without an assignment. This happened because the cost function maximized item throughput for each `Cart` individually, rather than system-wide.

It is an open question whether to maximize fleet utilization or system throughput. One the one hand, is seems problematic for some `Carts` to be idle, but the plan did manage to complete all of the jobs before their deadlines. On the other hand, an approach that maximizes fleet utilization might complete deliveries earlier, giving greater resilience in the face of delays.

~~~
% node build/samples/job-assigner-sample.js

Creating 5 carts with capacity = 10.
    Cart 0 at location 6 with capacity 10
    Cart 1 at location 9 with capacity 10
    Cart 2 at location 1 with capacity 10
    Cart 3 at location 5 with capacity 10
    Cart 4 at location 10 with capacity 10

Creating 10 transfer jobs.
    Job 0: move 1 items from 1 to 6 between 711 and 46476
    Job 1: move 4 items from 3 to 4 between 53 and 9974
    Job 2: move 2 items from 4 to 6 between 405 and 13253
    Job 3: move 2 items from 7 to 3 between 435 and 3779
    Job 4: move 5 items from 7 to 9 between 690 and 11057
    Job 5: move 5 items from 7 to 2 between 287 and 9006
    Job 6: move 1 items from 9 to 1 between 722 and 69911
    Job 7: move 3 items from 2 to 8 between 57 and 58249
    Job 8: move 1 items from 5 to 3 between 508 and 6278
    Job 9: move 1 items from 9 to 5 between 777 and 26130

=== Searching Job Assignments ===

Searched 875 assignments


=== Job Assignment Completed ===
------------------------------------------------------
Cart 4: [4,6,7]
Plan for cart 4 (working time = 2363):
  pickup 3 items at location 2 after 57 (job 7)
  pickup 5 items at location 7 after 690 (job 4)
  dropoff 5 items at location 9 before 11057 (job 4)
  pickup 1 items at location 9 after 722 (job 6)
  dropoff 3 items at location 8 before 58249 (job 7)
  dropoff 1 items at location 1 before 69911 (job 6)
------------------------------------------------------
Cart 2: [0,5,9]
Plan for cart 2 (working time = 2149):
  pickup 5 items at location 7 after 287 (job 5)
  pickup 1 items at location 9 after 777 (job 9)
  pickup 1 items at location 1 after 711 (job 0)
  dropoff 5 items at location 2 before 9006 (job 5)
  dropoff 1 items at location 5 before 26130 (job 9)
  dropoff 1 items at location 6 before 46476 (job 0)
------------------------------------------------------
Cart 1: [1,2,3]
Plan for cart 1 (working time = 1191):
  pickup 2 items at location 7 after 435 (job 3)
  pickup 4 items at location 3 after 53 (job 1)
  dropoff 2 items at location 3 before 3779 (job 3)
  dropoff 4 items at location 4 before 9974 (job 1)
  pickup 2 items at location 4 after 405 (job 2)
  dropoff 2 items at location 6 before 13253 (job 2)
------------------------------------------------------
Cart 3: [8]
Plan for cart 3 (working time = 715):
  pickup 1 items at location 5 after 508 (job 8)
  dropoff 1 items at location 3 before 6278 (job 8)
~~~

### Staffing Generator Sample

This is an example of a synthetic generator that produces `OutOfService` events
for a hypothetical workforce, consisting of multiple crews, each working a
specific shift.

In this example, there are two shifts - a `day shift` from 8am to 4pm, and a
`swing shift` from 4pm to midnight. Each shift has a 30 minute lunch break
and two other 15 minute breaks. Both shifts start and end at location 0 and
their breaks are to be taken at location 7.

~~~
% node build/samples/generator-sample.js

Day Shift: 08:00-15:59
  break: 10:00-10:15
  break: 12:00-12:30
  break: 14:00-14:15

Swing Shift: 16:00-23:59
  break: 18:00-18:15
  break: 20:00-20:30
  break: 22:00-22:15

Crews
  Day Shift: 3 employees
  Swing Shift: 2 employees

Carts:
  Cart 0 - home location is 0
  Cart 1 - home location is 0
  Cart 2 - home location is 0

Jobs:

Cart 0
  Job 0: cart 0 suspends at 0 between MIN and 08:00.
  Job 2: cart 0 suspends at 7 between 10:00 and 10:15.
  Job 3: cart 0 suspends at 7 between 12:00 and 12:30.
  Job 4: cart 0 suspends at 7 between 14:00 and 14:15.
  Job 1: cart 0 suspends at 0 between 15:59 and 16:00.
  Job 16: cart 0 suspends at 7 between 18:00 and 18:15.
  Job 17: cart 0 suspends at 7 between 20:00 and 20:30.
  Job 18: cart 0 suspends at 7 between 22:00 and 22:15.
  Job 15: cart 0 suspends at 0 between 23:59 and MAX.

Cart 1
  Job 5: cart 1 suspends at 0 between MIN and 08:00.
  Job 7: cart 1 suspends at 7 between 10:00 and 10:15.
  Job 8: cart 1 suspends at 7 between 12:00 and 12:30.
  Job 9: cart 1 suspends at 7 between 14:00 and 14:15.
  Job 6: cart 1 suspends at 0 between 15:59 and MAX.

Cart 2
  Job 10: cart 2 suspends at 0 between MIN and 08:00.
  Job 12: cart 2 suspends at 7 between 10:00 and 10:15.
  Job 13: cart 2 suspends at 7 between 12:00 and 12:30.
  Job 14: cart 2 suspends at 7 between 14:00 and 14:15.
  Job 11: cart 2 suspends at 0 between 15:59 and 16:00.
  Job 20: cart 2 suspends at 7 between 18:00 and 18:15.
  Job 21: cart 2 suspends at 7 between 20:00 and 20:30.
  Job 22: cart 2 suspends at 7 between 22:00 and 22:15.
  Job 19: cart 2 suspends at 0 between 23:59 and MAX.
  ~~~
