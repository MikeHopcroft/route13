# Graph Sample

The `Graph` class uses the
[Floyd-Warshall algorithm](https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm)
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

