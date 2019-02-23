// Agents are modelled as generator functions that perform some work and then
// yield their NextStep. The next step may be scheduled for a particular time
// in the future, e.g.
//
//   yield clock.until(200)         // Yield until time 200.
//
// or when a certain condition is true, e.g.
//
//   yield dispatcher.waitForJob()  // Yield until there is a job available.
//
// These generator functions, which are called Continuations, return NextSteps
// which instruct the system when to process the agent's next step.
//
// In the example, above, clock.until() returns a NextStep function that places
// the Continuation back on the event queue.
//
// dispacher.waitForJob() records the NextStep as waiting on a Condition which
// is fulfilled when jobs become available.

// A NextStep is a function that does something with a Continuation.
// The main use case is to schedule a Continuation to resume at some time in
// the future or when some condition becomes true.
export type NextStep = (continuation: IterableIterator<NextStep>) => void;

// An agent is modeled as a Continuation, which is a generator of NextSteps.
export type Continuation = IterableIterator<NextStep>;

// The start function wakes up a Continuation and then schedules its next step.
export function start(continuation: Continuation) {
    const { done, value } = continuation.next();
    const schedule = value;
    if (!done) {
        schedule(continuation);
    }
}
