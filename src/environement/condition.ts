import { Continuation, resume } from './continuation';

export class Condition {
    private continuations: Continuation[];
    private pendingWakeups: number;

    constructor() {
        this.continuations = [];
        this.pendingWakeups = 0;
    }

    sleep(iterator: Continuation) {
        if (this.pendingWakeups > 0) {
            --this.pendingWakeups;
            resume(iterator);
        }
        else {
            this.continuations.push(iterator);
        }
    }

    wakeAll() {
        while (this.continuations.length > 0) {
            this.wakeOne();
        }
    }

    wakeOne() {
        const iterator = this.continuations.shift();
        if (iterator) {
            resume(iterator);
        }
        else {
            ++this.pendingWakeups;
        }
    }
}
