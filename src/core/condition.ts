import { Agent, start } from './agent';

// Conditions hold suspended Agents until a certain condition has been
// met. Conditions are analogous to condition variables used in multi-threaded
// programming.
export class Condition {
    // Agents currently waiting.
    private agents: Agent[];

    // Number of calls to wakeOne() when there were no Agents
    // waiting to be woken. Calls to sleep() will wake immediately when
    // pendingWakeups is greater than zero.
    private pendingWakeups: number;

    constructor() {
        this.agents = [];
        this.pendingWakeups = 0;
    }

    // Put an Agent to sleep. The Agent will sleep until
    // awoken by a call to wakeAll() or wakeOne().
    sleep(iterator: Agent) {
        if (this.pendingWakeups > 0) {
            --this.pendingWakeups;
            start(iterator);
        }
        else {
            this.agents.push(iterator);
        }
    }

    // Wake up all waiting Agents.
    wakeAll() {
        const agents = this.agents;
        this.agents = [];
        this.pendingWakeups = 0;
        for (const agent of agents) {
            // WARNING: agent could call sleep from inside start().
            // This is why we iterate over agents instead of this.agents.
            start(agent);
        }
    }

    // Wake up exactly one waiting Agent. If there are not Agents waiting,
    // increment pendingWakeups counter to immediately awake on future calls to
    // sleep().
    wakeOne() {
        const iterator = this.agents.shift();
        if (iterator) {
            start(iterator);
        }
        else {
            ++this.pendingWakeups;
        }
    }
}
