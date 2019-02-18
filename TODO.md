# TODO List

* ~~Change model for suspend/resume actions.~~
    * ~~One action, instead of a pair.~~
    * ~~Action, TransferAction, SuspendAction~~
* applyAction
    * For performance, make logger optional. if (logger) ...
    * To avoid code duplication, make this method available to the simulator?
* Remove unused packages from packages.json
* Fix `npm run test`
* Set up travis ci
* Unit test buildTrie
* Unit test RoutePlanner
* Factor out trie code
* Factor out RoutePlanner
* Factor commonly used types out of RoutePlanner
* Scoring with bias from job urgency
* Performance measurements
* Floyd-Warshall


## Design Issues
* Is there some way to use the same code to apply actions and explain actions?
    * Current code formats explanations even if they aren't used.
    * The simulator will also use this logic.
* Splitting large jobs into multiple smaller jobs.
    * What if one route has two large jobs. Which job is split? How are alternatives compared? Running time? Bags per time?
    * How are job tuples updated when a job is split?
    * Would it suffice to split large jobs into full carts? This would force empty carts to large jobs.
* Need some way to constrain new plan proposals to satisfy in-progress plan elements. For example, if a plan involves jobs a, b, and c, and job a has already been picked up, new plans should contain job a.
* Need some way to constrain new plan proposals to satisfy constraints like planned out-of-service times.



## Proposed Algorithm

~~~
for each cart
    for each {a,b,c,..} subset of jobs
        create plan(cart, [a,b,c])
            for each permutation of destinations
                exclude if capacity is exceeded
                exclude if deadlines not fulfilled
                find best scoring plan
        add plan to priority queue
        add plan to each job => plan list mapping

// Greedy assign boulders
while (some criteria)    // more carts to assign, value of remaining plans adequate
    pull first plan from priority queue
    assign plan to cart
        this involves marking plamn's jobs as assigned
        marking plan itself as assigned
        removing all conflicting plans from consideration

// Backfill with sand
// Either pick carts and assign most valuable add-on job
// or pick jobs and find best cart to assign
for each assigned plan in order of decreasing elapsed time

~~~
