// Agents are modelled as generator functions that perform some work and then
// yield their NextStep. The next step may be scheduled to run at a particular
// time in the future, e.g.
//
//   yield clock.until(200)         // Yield until time 200.
//
// or when a certain condition is true, e.g.
//
//   yield dispatcher.waitForJob()  // Yield until there is a job available.
//
// These generator functions, return NextSteps which instruct the system when to
// process the Agent's next step.
//
// In the example, above, clock.until() returns a NextStep() function that
// places its Agent back on the event queue.
//
// dispacher.waitForJob() records the NextStep as waiting on a Condition which
// is fulfilled when jobs become available.

// A NextStep is a function that does something with an Agent.
// The main use case is to schedule an Agent to resume at some time in
// the future or when some condition becomes true.
export type NextStep = (agent: IterableIterator<NextStep>) => void;

// An Agent is a generator of NextSteps.
export type Agent = IterableIterator<NextStep>;

// The start function wakes up an Agent and then runs its NextStep.
export function start(agent: Agent) {
    // console.log('start(agent)');
    const { done, value } = agent.next();
    const nextStep = value;
    if (!done) {
        // console.log('  nextStep(agent)')
        nextStep(agent);
    }
}
