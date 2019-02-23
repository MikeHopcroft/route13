# Planning Algorithm Ideas

Here are some ideas for planning algorithms.

Choice of algorithm is a tradeoff between planning time and the quality of the plan.

Longer planning times may result in better plans, but these plans may be less relevant if the world has changed significantly during the time the plan was being generated.

Longer planning times also present challenges in evaluating and comparing plans. Suppose, for example, that the planner takes 5 minutes, and is run at 5 minute intervals. In this case, simulating a single day would take 24 hours.

## Greedy Assign One Job
`Cart` work on one `Job` at a time. When a `Job` is completed, `Cart` selects a new, unassigned `Job`, based on criteria such as
* Proximity to current location
* Most valuable in terms of reducing failed `Job` risk
* Random selection

In this approach, planning is fairly lightweight, and is done incrementally, as `Carts` become available.

## Greedy Assign Multiple Jobs
`Carts` maintain fixed-sized list of intended `Jobs`. When a `Job` is completed, `Cart` selects a new, unassigned `Jobs` based on a criteria such as
* Nearest to end of current intended route
* Value of new optimal route that incorporates new `Job`

This approach, is also incremental, as `Carts` become available, but the planning costs a bit more, as it requires computing optimal routes for each set of `Jobs` under consideration.

## Brute-force enumeration of all {cart, [a, ,b, c]}
This approach examines every combination of `n` jobs assigned to every `Cart`. After enumerating all of the combinations it attempts to select a set of `Job` assignments that maximizes some value function. 

This approach is fairly compute-intensive, and would likely be run out-of-process at regular intervals.

~~~
for each cart
    for each {a,b,c,..} subset of jobs
        create plan(cart, [a,b,c])
            identify set of actions required to perform [a,b,c]
            for each permutation of actions
                exclude if ordering constrain violated
                exclude if cart capacity is exceeded
                exclude if deadlines not fulfilled
            select the plan with the shortest duration
            score the plan
        add plan to priority queue ordered by score
        add plan to relevant Map<Job,[Plan]>.

// Greedy assign boulders
while (some criteria)
    pull top-scoring plan from priority queue
    assign plan to cart
        Mark plan's jobs as assigned
        Removing all conflicting plans from consideration

// Possibly backfill with sand
// Either pick carts and assign most valuable add-on job
// or pick jobs and find best cart to assign
for each assigned plan in order of decreasing elapsed time
    attempt to add unassigned job
~~~

## Linear Programming Solver

**Work-in-progress.** May formulate as single-step or multi-step plan.

This approach is fairly compute-intensive, and would likely be run out-of-process at regular intervals.

## Machine Learning Approach

**Work-in-progress.**
