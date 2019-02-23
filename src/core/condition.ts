import { Continuation, start } from './continuation';

// Conditions hold suspended Continuations until a certain condition has been
// met. Conditions are analogous to condition variables used in multi-threaded
// programming.
export class Condition {
    // Continuations currently waiting.
    private continuations: Continuation[];

    // Number of calls to wakeOne() when there were no continuations
    // waiting to be woken. Calls to sleep() will wake immediately when
    // pendingWakeups is greater than zero.
    private pendingWakeups: number;

    constructor() {
        this.continuations = [];
        this.pendingWakeups = 0;
    }

    // Put a Continuation to sleep. The Continuation will sleep until
    // awoken by a call to wakeAll() or wakeOne().
    sleep(iterator: Continuation) {
        if (this.pendingWakeups > 0) {
            --this.pendingWakeups;
            start(iterator);
        }
        else {
            this.continuations.push(iterator);
        }
    }

    // Wake up all waiting Continuations.
    wakeAll() {
        while (this.continuations.length > 0) {
            this.wakeOne();
        }
    }

    // Wake up exactly one waiting Continuation. If there are not Continuations
    // waiting, increment pendingWakeups counter to immediately awake on future
    // calls to sleep().
    wakeOne() {
        const iterator = this.continuations.shift();
        if (iterator) {
            start(iterator);
        }
        else {
            ++this.pendingWakeups;
        }
    }
}
