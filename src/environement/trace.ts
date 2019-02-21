import { Cart, Job, LocationId, SimTime } from '../types';
import { Environment } from './environment';
import { Clock } from './clock';

export interface Trace {
    cartArrives(cart: Cart): void;
    cartDeparts(cart: Cart, destination: LocationId): void;
    cartWaits(cart: Cart, time: SimTime): void;

    cartBeginsLoading(cart: Cart, quantity: number): void;
    cartFinishesLoading(cart: Cart): void;

    cartBeginsUnloading(cart: Cart, quantity: number): void;
    cartFinishesUnloading(cart: Cart): void;
    
    cartSuspendsService(cart: Cart): void;
    cartResumesService(cart: Cart): void;

    jobIntroduced(job: Job): void;
    jobAssigned(job: Job): void;
    jobSucceeded(job: Job): void;
    jobFailed(job: Job): void;

    plannerStarted(): void;
    plannerFinished(): void;
}

export class TextTrace implements Trace {
    clock: Clock;
    output: (text: string) => void;

    constructor(clock: Clock, output: (text: string) => void) {
        this.clock = clock;
        this.output = output;
    }

    private format(text: string) {
        this.output(`${this.clock.time}: ${text}`);
    }

    cartDeparts(cart: Cart, destination: LocationId): void {
        this.format(`Cart ${cart.id} departs location ${cart.lastKnownLocation} for location ${destination}.`);
    }

    cartArrives(cart: Cart): void {
        this.format(`Cart ${cart.id} arrives at location ${cart.lastKnownLocation}.`);
    }

    cartWaits(cart: Cart, time: SimTime): void {
        this.format(`Cart ${cart.id} pauses until ${time}.`);
    }

    cartBeginsLoading(cart: Cart, quantity: number): void {
        this.format(`Cart ${cart.id} begins loading ${quantity} items.`);
    }

    cartFinishesLoading(cart: Cart): void {
        this.format(`Cart ${cart.id} finishes loading (payload=${cart.payload}).`);
    }

    cartBeginsUnloading(cart: Cart, quantity: number): void {
        this.format(`Cart ${cart.id} begins unloading ${quantity} items.`);
    }

    cartFinishesUnloading(cart: Cart): void {
        this.format(`Cart ${cart.id} finishes unloading (payload=${cart.payload}).`);
    }

    cartSuspendsService(cart: Cart): void {
        this.format(`Cart ${cart.id} suspends service at location ${cart.lastKnownLocation}.`);
    }

    cartResumesService(cart: Cart): void {
        this.format(`Cart ${cart.id} resumes service at location ${cart.lastKnownLocation}.`);
    }


    jobIntroduced(job: Job): void {
        this.format(`Job ${job.id} introduced.`);
    }

    jobAssigned(job: Job): void {
        this.format(`Job ${job.id} assigned to cart ${job.assignedTo}.`);
    }

    jobSucceeded(job: Job): void {
        this.format(`Job ${job.id} succeeded.`);
    }

    jobFailed(job: Job): void {
        this.format(`Job ${job.id} failed.`);
    }

    plannerStarted(): void {
        this.format(`Planning cycle started.`);
    }

    plannerFinished(): void {
        this.format(`Planning cycle finished.`);
    }
}