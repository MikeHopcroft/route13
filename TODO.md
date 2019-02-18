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
