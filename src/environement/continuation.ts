// Workers are modelled as generator functions that perform some work and then
// yield their NextStep. The next step may be scheduled for a particular time
// in the future, e.g.
//
//   yield clock.until(200)         // Yield until time 200.
//
// or when a certain condition is true, e.g.
//
//   yield dispatcher.waitForJob()  // Yield until there is a job available.
//
// Worker generator functions, also called Continuations, return NextSteps
// which instruct the system when to process the worker's next step.
//
// In the example, above, clock.until() returns a NextStep function that places
// the worker/Continuation back on the event queue.
//
// dispacher.waitForJob() records the NextStep as waiting on a Condition which
// is fulfilled when jobs become available.
export type NextStep = (continuation: IterableIterator<NextStep>) => void;

// A worker is modeled as a Continuation, which is a generator of NextSteps.
export type Continuation = IterableIterator<NextStep>;

// The resume function wakes up a worker/Continuation and then schedules its
// next step.
export function resume(continuation: Continuation) {
    const { done, value } = continuation.next();
    const schedule = value;
    if (!done) {
        schedule(continuation);
    }
}
