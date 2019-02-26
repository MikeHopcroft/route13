# Building a Simulator

`Route13` provides
* [Agent pattern](./architecture.md#agent)
* Clock
* Condition
* Estimators
* Trace
* Graph
* Various planning algorithms and shims

You provide
* An environment
* Various implementations of agents

## A Simple Example

Warehouse with 10 loading docks.
Forklifts move pallets from dock to dock.
