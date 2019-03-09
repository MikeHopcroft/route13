# Job Assignment Sample

The `JobAssigner` class performs a brute force search of
assignments of tuples of `Jobs` to `Carts`. It filters out those
assignments that fail to satisfy constraints
(e.g. those that exceed cart capacities or fail to meet delivery deadlines).
Remaining assignments are then scored by the number
of items delivered per unit of working time. A greedy algorithm 
is then used to pick a non-conflicting subset of assignments.
Two assignments are considered to conflict if they
share either `Jobs` or `Carts`.

The run below examines assignments consisting of of one, two, or three jobs.
It ends up assigning three jobs to `Carts` 1, 2, and 4, and one job to `Cart 3`.
There is room for improvement here because `Cart` 5 was left without an assignment.
This happened because the cost function maximized item throughput for each `Cart` individually,
rather than system-wide.

It is an open question whether to maximize fleet utilization or system throughput.
On the one hand, it seems problematic for some `Carts` to sit idle,
but the plan did manage to complete all of the jobs before their deadlines.
On the other hand, an approach that maximizes fleet utilization
might complete deliveries earlier, giving greater resilience in the face of delays.

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

