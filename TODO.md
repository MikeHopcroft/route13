# TODO List

* Remove unused packages from packages.json
* Fix `npm run test`
* Set up travis ci
* Unit test buildTrie
* Unit test RoutePlanner
* Factor commonly used types out of RoutePlanner
* Scoring with bias from job urgency
* Performance measurements


## Design Issues
* Is there some way to use the same code to apply actions and explain actions?
    * Current code formats explanations even if they aren't used.
* Splitting large jobs into multiple smaller jobs.
    * What if one route has two large jobs. Which job is split?
    * How are job tuples updated when a job is split?
