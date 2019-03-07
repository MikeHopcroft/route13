# TODO List

This is a very rough `TODO` list that captures issues encountered
while coding during the early stages when the codebase is too fluid to benefit from a formal issue tracking system. This list will be cleaned up over time and eventually migrated to GitHub issues.

* Format all time values in logs and other output.
* Document the interpretation of time as milliseconds.
* ~~Rename `Plan` to `Route`.~~
* ~~Rename `Assignment` to `Plan`.~~
* ~~Introduce planning cycle.~~
* Introduce pluggable one-off planner.
  * ~~interface Planner~~
  * ~~JobAssigner implements Planner~~
* Dispatcher.planningTime should be a constructor parameter
* Type for Plan = Map<Cart, Job[]>. How does new work?
* Unify Driver.drive() and Driver.drive2(). Pluggable incremental planner.
* Replanning when Planner generates a job assignment that is no longer feasible - race condition
* Policy for marking failed/succeeded jobs.
* Removing active jobs from list
* Review Cart vs CartId, Job vs JobId
* Review Environment publics like fleet and unassignedJobs
* Dead code in JobMerger
* merge() vs merge2()


* ~~Rename `Continuation` to `Agent`~~
* StaffingPlan. Finish implementing. Write unit tests. Add to simulation.
* TransferGenerator. Implement. Write unit tests. Add to simulation.
* Finish implementing planner.test.ts
* Event that gathers stats like job completion counts.
* JSON tracing

* Friendly name decoder for LocationIds
* Friendly time formatting
* Friendly name decoder for arrivals/departures
* Consider making CartFactory be closure instead of classes. It only has one method, unlike JobFactory.
* ~~Consider renaming Action => ActionBase, AnyAction => Action~~
* ~~Consider renaming Job => JobBase, AnyJob => Job~~
* ~~Separate core from simulator~~
* ~~Rename repo~~
* ~~NPM package, .npmignore~~
* Architectural diagrams - use Illustrator? Consider some open-source compatible diagram format?
* x csvTextTrace, structuredTrace, jsonTrace
* readonly and private keywords

* Dispatcher
    * ~~Seems like waitForJob() should be an Environment method.
      Either that or jobAvailableCondition should move to Dispatcher.~~
    * ~~Distinction between Dispatcher and Environment not clear.~~
    * ~~Are Jobs even part of the environment? Why even have an environment?~~
    * Consider making a class that combines unassignedJobs with jobAvailableCondition.wakeOne()?

* ~~Right now Dispatcher main loop is not running. Dispatcher needs lots of work.~~
* Unit Tests
    * Figure out why descriptions are grouping tests (e.g. planner)
    * . buildTrie - needs cleanup and commenting
    * ~~Combinations~~
    * ~~Floyd-Warshall~~
    * RoutePlanner
* Comments for Environment, some way to create carts, initialize fleet
* Comments for Agent/Driver
* Comments for Dispatcher
* FastPriorityQueue - doesn't work with TS
* Linter
* CODING.md
    * import ordering
    * Use of exceptions
    * Logging strategy
* Remove notes.txt
* Clean up TODO.txt
* Samples
    * Optimal route planning
        * ~~RoutePlanner.applyAction should not take cart parameter.~~
        * Plan score is different than working time
        * ~~Logging for failed plans - right now this always goes to the console~~
        * ~~Better text output~~
        * x Use chalk
    * Simulator log.
* Floyd-Warshall
    * ~~Generate cost and next functions in proper form.~~
    * ~~Unit test~~
    * Unit test with new route
    * ~~Documentation~~
    * ~~Move to Estimators directory~~
* README.md
    * ~~Project name~~
    * ~~Instructions~~
    * Explain Flyod-Warshall
    * Overview
    * Architectural document
    * How to use library.
* ~~Set up travis ci~~
* ~~Remove unused packages from packages.json~~
* Figure out postcompile in packages.json


* ~~Job.assignedTo should be of type Cart, rather than number.~~
* ~~Functions to create each kind of job.~~
* Scenario of introducing pre-assigned jobs like out-of-service periods.

* Agent updates job status
* Agents
    * Assign FIFO job as carts become available
    * Assign nearest job as carts become available
    * Assign best combination of jobs
* REPL
* Logging
    * ~~Human readable or machine readable?~~
* ~~Need better terminology for IterableIterator<SimTime>~~
* . Difference between until() and waitUntil()
* Environment
    * ~~Logging approach~~
    * Job assignments and job assignment merging
    * Main cart loop.
        * Is it kicked off by new job assignments?
        * Do carts have own loop that looks for new assignments? Don't want to poll, however.
    * API/method to introduce job list and initial environment state.
    * Consider integration of other planners.
* applyAction
    * ~~For performance, make logger optional. if (logger) ...~~
    * To avoid code duplication, make this method available to the simulator?
* Scoring with bias from job urgency
* Performance measurements
* . Coding guidelines
* Contributing guidelines
* ~~License~~
* ~~README.md~~
* Planning algorithms
    * Assign random
    * Assign closest
    * Optimize n-move lookahead for jobs before time horizon.
* Simulator/Environment
    * Terminology: simulation is dataFeed + environment + planner
    * Terminology: fleet, staff
* Simulator data feeds
* ~~.npmignore~~
* ~~NPM package publish and version.~~
* ~~Project name~~


## Design Issues
* How to change an out-of-service job.
    * Suppose a cart is waiting out-of-service until 3pm and then a driver comes along at 2pm.
* Is there some way to use the same code to apply actions and explain actions?
    * ~~Current code formats explanations even if they aren't used.~~
    * The simulator may also use this logic.
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


## Completed
* ~~Change model for suspend/resume actions.~~
    * ~~One action, instead of a pair.~~
    * ~~Action, TransferAction, SuspendAction~~
* ~~Fix `npm run test`~~
* ~~Factor out trie code~~
* ~~Factor out RoutePlanner~~
* ~~Factor commonly used types out of RoutePlanner~~
* ~~Floyd-Warshall~~

