# Design Issues

## Modifying Jobs
The original design intent was that `Jobs` would immutable, with the exception of their `assignedTo` fields. There may be scenarios where it would be desirable to either change a `Job` or replace it with another `Job`:
* a `Cart` is waiting out-of-service until 3pm and then a driver comes along at 2pm.
* a pickup is scheduled for location 10 and then the location is changed, at the last minute, to location 11.
* a `Job` is cancelled at the last minute.

## Sharing Job Sequencing Code
To determine the best sequence of `Actions` to complete a set of `Jobs` RoutePlanner needs to predict how long `Actions` take and how they impact facets of the state, like `Cart` payloads.

This code has significant overlap with the code in the `Driver` agent, which simulates performing the selected `Action` sequence.

This code overlap increases code maintenence cost, while offering opportunities for divergence.

Is there any way to increase code sharing between planning elements and simulating elements?

## Splitting large `Jobs` into multiple, smaller `Jobs`.
It some cases it may be possible to partially fulfill a `Job` by splitting it into two smaller `Jobs`.

`Job` splitting would likely add a combinatorial explosion to an, already large, planning space. If the planner were to split `Jobs`, we'd need some means of comparing alterntives. Do we minimize delivery time, maximize cart untilization, maximize quantity of items transported or number of jobs completed? The answer could be different, depending on the scenario. In a freight terminal where pallets are packed into containers, a container can't leave until it has the complete set of pallets on board. In an airline, the plane won't wait for missing bags.

One heuristic might be to split large jobs into `Cart`-size chunks before they get to the planner. This would have the effect of forcing empty carts to locations with large jobs.

## Merging New Plans
Planning is assumed to take some amount of time, and during this time, the state of the world will change. It is possible that a plan that would have been valid, if the world had been paused during planning, is no longer valid a the time planning completes.

Here's an example scenario:
* At the start of planning, `Cart 1` is intending to perform `Jobs` `A`, `B`, and `C`, and has already loaded items for `Job A`.
* During planning, `Cart 2` drives to another location and loads items for `Job B`.
* Meanwhile, the planner sees an opportunity to assign `Job B` to `Cart 2`.
* When planning completes, `Cart 1` is asked to perform `Jobs` `A`, `C`, and `D`.

Here's the same race condition, expressed as pseudo-code:
~~~
Cart is assigned A, B, C.
Cart starts on A.
    Planner starts.
    Cart finishes A and starts on B.
    Planner finishes with assignment A, C, D.
    How does cart merge [A, B, C] with [A, C, D]?
        Challenge: [C, D] might not be appropriate for cart doing B.
        Challenge: Taking the union of old and new assignments (i.e [A, B, C, D]) might result in an overly complicated plan.
~~~

One idea is that the planner could assume that the `Cart` will retain any assignment that could be started within the planning window.

## Pre-assigned Jobs
Jobs corresponding to out-of-service periods for specific `Carts` may be known far in advance. These could correspond to mandated worker breaks, `Cart` service intervals, etc.

While these `Jobs` are known in advance, they should only be incorporated into the planning process when they would have an impact on the resulting plans.

Suppose, for example, that the planner knew about 10 break periods for a particular `Cart` over the course of a day. If the planner were to consider tuples of `Jobs` that included all of the pre-assigned `Jobs`, it might never consider unassigned `Jobs` that could be completed before the first out-of-service `Job`.