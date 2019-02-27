# Route13 Architecture

THIS DOCUMENT IS CURRENTLY A WORK IN PROGRESS

`Route13` is a framework for building simulators and optimizers for transportation networks.
A `Route13` simulation typically consists of a composition of five components:
* **`Generators`**, which produce streams of external events that serve as input to the simulation.
* The **`Clock`**, which is the event queue that drives the simulation.
* The **`Environement`**, which maintains the current state of the world.
* **`Agents`**, such as the `Driver` and the `Dispatcher`, which perform actions in the Environment.
* **`Planner`**, which strives to find an optimal ordering of activies for Agents.

![Route13 Architecture](./images/route13-architecture.png)


## Generators
`Generators` produce streams of external events that serve as input to the simulation. These events might correspond to work orders, like moving a container from a pier to a railcar; equipment downtime for repairs or refueling; or staffing changes for shifts or breaks.

The key characteristic of the Generator event stream is that it is not impacted by actions made by agents in the simulator. A schedule for vessels arriving and departing a container port could be the basis for a Generator, as long as the time required unload and then load each vessel was independent of the routing of the forklifts. If the forklift routing could delay departures, and therefore block new arrivals, it would be necessary to simulate arrival and departure times, instead of playing them back from a schedule.

![Container Port](./images/pexels-photo-753331.jpeg)

### Playback Generators
Perhaps the simplest generator is one that plays back recorded events from the reeal world. A container terminal, for example, may have detailed logs of ship arrival and departure times, along with pier assignments and manifests that specify how containers move between gantries and rail cars.

Such a generator may rely on complex [ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load) to generate work orders by joining ship and rail movement logs with manifests, but once the work orders have been composed, the generator need only enumerate them in chronological order.

The playback generator is useful when comparing the performance of optimization algorithms on certain historical days.

![Weather Delays](./images/pexels-photo-210199.jpeg)
### Transforming Playback Generators
Sometimes it is useful to ask "what if" questions, based on a recorded event stream.
Suppose, for example, that an airline has recordings of flight arrival and departure times at a particular airport, along with gate assignments and baggage routing information for connecting flights. When evaluating a planning algorithm, it might be interesting to see how it would perform on the same day, if thunderstorms were to delay afternoon flight arrivals.

Adverse weather can wreak havoc on plans. Bags on planes arriving late may have tighter connection times. Ground stops, diversions, and low fuel situations may change the arrival order and gate assignments at the last minute.

One can build a new generator that layers weather delays on top of the output of a Playback Generator. This approach typically makes use of a simple simulator to determine a plausible sequence of events after adding random delays.

Consider, again, the airport simulation. It is not sufficient to just alter flight arrival times because this could result in two planes occupying the same gate at the same time. A simple, `Gate Assignment Simulator` that models typical aircraft operations relating to taxi times, gate assignment, and turnaround times can fixup the gate assignments in the modified event stream.

The complexity of the of the `Gate Assignment Simulator` depends on the level of fidelity required by the main simulation. The simplest possible gate assigner needs to know which gates are available and which are occupied at any given time. Since late-arriving incoming flights can cause delays in outgoing flights, the gate assigner must have some model for aircraft turn around times and policies.

A more sophisticated gate assigner might incorporate local knowledge and expert heuristics, such as sending a late-arriving domestic flight to the international terminal to facilitate a large group of passengers with tight connections to Paris, or holding a departing flight to allow from connections from a delayed inbound flight.

### Synthetic Generators
Sometimes logs of real-world events are not available. This would be the case for a planned facility or one under construction. The situation also arises when developing generic planning algorithms for a class of facilities with similar capabilities and contraints.

A `Synthetic Generator` uses probability distributions to create a sequence of work orders and resource level changes that conform to a set of business rules.

As with a `Transforming Playback Generator`, a `Synthetic Generator` typically incorporates a small simulator to assign item sources and sinks to the locations of physical infrastructure like piers, loading docks, and gates. The complexity of this simulator depends on the constraints of the physical environment. As an example, a container port might have piers that can accomodate vessels of various sizes. Randomly generated vessels would need to be assigned to unoccupied piers of the appropriate size.

`Route13` provides two synthetic generators.
* `StaffingPlan` - creates a fleet of `Carts` and corresponding `OutOfServiceJobs` for a set of `Crews` working various `Shifts`.
* `TransferGenerator` 

### Implementation of Generators
`Route13` generators interact with the master simulation via the [Agent Pattern](#agent). Generators that contain an internal simulator can use the same agent-driven architecture as the master simulator.

~~~
TODO: SAMPLE generator code
~~~

<img src="./images/clock-147257_1280.png" width="200">

## Clock
`Route13` is an event-driven simulation framework. Unlike a video game that advances its clock at regular intervals to achieve a desired framerate, `Route13` advances its clock to the time of the next scheduled event.

The `Clock` maintains a priority queue of events, ordered by start time. The main loop of the simulation pulls events out of the queue and runs them. This continues as long as there are events in the queue. When the queue becomes empty, the simulation ends.

The act of processing an event may result in new events being queued. For example, an event that initiates an transfer of items from point A to point B might trigger a chain of events, each enqueued as its predecessor was processed:
* `Move A to B`: instruct cart to drive to A. Then enqueue
* `Arrive at A`: instruct cart to load items. Then enqueue
* `Items Loaded`: instruct cart to drive to B. Then enqueue
* `Arrive at B`: instruct cart to unload items. Then enqueue
* `Items Unloaded`: record task as complete. No follow on event.

It is sometimes desirable for event chains to form loops.
Suppose you want to an external planner to run at regular intervals.
The `StartPlanning` event could trigger plan generation and then enqueue a `FinishedPlanner` event that would apply the new plan and then enqueue a new `StartPlanning` event:
* `Start Planning`: request new plan from planning service. Then enqueue
* `Finish Planning`: apply new plan. Then enqueue `Start Planning`

Event loops typically consult a system shutdown variable, which allows them to break out of the loop, in the case of a time-bounded simulation.

### Eventing Model
A `Clock` event is a pairing of a time value and a generator of `NextStep` functions, known as an `Agent`.

The `Clock's` main loop pulls the next event in time from the priority queue, then advances its `Agent`, which yields a `NextStep` function, which is then executed. Typically, the `NextStep` will just requeue the `Agent` to be awoken at some point in the future.

~~~
mainloop() {
    while (true) {
        const event = this.queue.poll();
        if (event) {
            this.time = event.time;
            start(event.agent);
        }
        else {
            break;
        }
    }
}

start(agent: Agent) {
    const { done, value } = agent.next();
    const nextStep = value;
    if (!done) {
        nextStep(agent);
    }
}
~~~

You can read more about `Agents` and `NextStep` functions in the [Agent Pattern](#agent) section.


![Container Terminal](./images/pexels-photo-1427107.jpeg)
## Environment
The `Environment` maintains the current known state of the world and provides methods, called `estimators`, for predicting the outcomes of various physical processes.

### Physical State
Known state includes physical state, such as the locations of carts; and logical state, such as our best knowledge of upcoming arrivals and shift changes.

As `Route13` is concerned with transportation networks, its physical state consists of the locations of a fleet of carts.
* `Location` - Every location in the environment is associated with a `LocationId`. Locations typically correspond to physical infrastructure like piers, loading docks, and gates. Locations also designate parking lots, fueling stations, and break rooms.
* `Cart` - Transports items from one location to another. Could be a forklift or a baggage cart or a tractor trailer. Carts have unique `ids`, and fields specifying `capacity`, current `payload`, and last known `LocationId`.

Note that `Route13` does not simulate staffing levels. If staffing simulation is desired, it can be implemented as a separate, upstream `Route13` simulator that acts as a `generator`.

`Route13` does not simulate congestion due to `Cart` movements. The effects of congestion can be modelled by the `TransitTimeEstimator` function provided to the `Environment` (see the section on [Estimators](#estimators) for more information).

### Logical State
`Route13` models the assignment of `Jobs` to `Carts`. At any given time, the environment is aware of a set of `Jobs`, some of which will start in the future, and some which are in progress. The `Environment` receives notification of new `Jobs` from a `Generator`.

The `Environment` supports two types of `Jobs`:
* `TransferJob` - transfers a specified quantity of items from location `A` to location `B`, within a window of time, starting when the items are available at `A` and ending at the delivery deadline.
* `OutOfServiceJob` - takes a cart out of service at a specified location during a window of time. Used to model crew breaks, refueling, repairs, and breakdowns.

### <a name="estimators"></a> Estimators
The `Environment` is configured with four functions that assist in modelling actions necessary to complete jobs.

* `TransitTimeEstimator` - a function that estimates the time for a cart to move from location `A` to location `B` at a certain time of day. The `Graph` class provides a TransitTimeEstimator` based the [Floyd-Warshall](https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm) shorted path algorithm.
* `RouteNextStep` - a function that gives the next `LocationId` on the shortest path from location `A` to location `B`. The `Graph` class also provides this function.
* `LoadTimeEstimator` - a function that estimates the time to load a certain quantity of items at a certain location and time of day.
* `UnloadTimeEstimator` - a function that estimates the time to unload a certain quantity of items at a certain location and time of day.

## Agents
`Agents` are responsible for doing work in the simulation. `Route13` provides a `Driver` agent and a `Dispatcher` agent. 

![Forklift](./images/Pallet-Machine-Worker-Warehouse-Forklift-Industry-835340.jpg)

### Driver
### Dispatcher
### <a name="agent"></a> The Agent Pattern
`Agents` in `Route13` are implemented as generator functions.
The use of generator functions greatly simplifies `Agent` development and maintenence by allowing one to express an inherently asynchrounous process as if it were synchronous.

NOTE: PLAN TO INTRODUCE THE AGENT PATTERN EXAMPLES HERE BEFORE
MAKING THE CASE FOR THE PATTERN IN THE MOTIVATION SECTION.

#### Motivation

NOTE: THE MOTIVATION SECTION FIRST DISCUSSES THE APPROACH NOT TAKEN,

To motivate the discussion, let's consider a simple `Agent` that moves items from location `A` to location `Z`. This involves the following sequence of operations:
1. Drive to `A`
1. Wait until the items are ready for pickup
1. Load items
1. Drive to `Z`
1. Unload items

Since `Route13` is event-driven, each of the steps above will need to be happen as a result of running an event pulled from the `Clock's` priority queue.

One could implement the entire transfer job as a single event object that contains a state machine. The event could keep track of its current step, and use a switch statement to determine what to do on each step. Something like

~~~
class TransferEvent implements Event {
    ... constructor, member declarations, etc. ...

    run(): Event {
        switch (this.state) {
            case 1:
                this.driveTo(this.pickupLocation);
                break;
            case 2:
                this.waitUntil(this.itemsReady);
                break;
            case 3:
                this.load(this.quantity);
                break;
            case 4:
                this.driveTo(this.dropoffLocation);
                break;
            case 5:
                this.unload(this.quantity);
        }

        ++this.state;

        if (this.state < 5) {
            return this;
        }
        else {
            return null;
        }
    }
}
~~~

The problem is more complicated than it looks because some of operations, like `this.driveTo(Z)`, have sub-operations:

1. Drive to `B`
1. Drive to `C`
1. Drive to `D`
1. etc...

These can be handled with another state machine inside `this.driveTo()`, but this just introduces more complexity and boilerplate code.

#### Using Generator Expressions
`Route13` agents are implemented as generators of `NextSteps`. A `NextStep` is a function that specifies
the conditions under which the computation should resume.

`Route13` provides two built-in `NextStep` implementations.
The first, which is produced with `Clock.until()` suspends computation until a certain time. Here's an example.

~~~
// This agent waits 100 time units
function* wait100() {
    console.log(`${clock.time}: About to wait.`);
    yield clock.until(clock.time + 100);
    console.log(`${clock.time}: Finished waiting`);
}
~~~

The second `NextStep` suspends until a certain condition is signaled.

~~~
// This agent waits until a condition is signaled.
function* waitForCondition(condition: Condition){
    console.log(`${clock.time}: About to wait for condition.`);
    yield condition.sleep();
    console.log(`${clock.time}: Condition signaled.`);
}
~~~


 what the `Clock's` event loop should do with a
~~~
function *transfer() {
    yield* driveTo(pickupLocation);
    yield* waitUntil(itemsReady);
    yield* loadItems();
    yield* driveTo(dropoffLocation);
    yield* unloadItems();
}
~~~

Suspending the computation until a specified time.
~~~
yield clock.until(time);
~~~

Suspending the computation until a condition is met.
~~~
yield condition.sleep();
~~~

Delegating the computation as a call to another agent:
~~~
yield* agent();
~~~

 that produce iterators of `NextStep` functions.

## Planner

### Next Available
### Nearest Available
### N-move Lookahead
### Linear Programming
### ML Model

### Towers of Hanoi