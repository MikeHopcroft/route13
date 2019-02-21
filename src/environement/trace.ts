import chalk, { Chalk, ColorSupport } from 'chalk';

import { Cart, Job, LocationId, SimTime } from '../types';
import { Clock } from './clock';

export interface Trace {
    cartArrives(cart: Cart): void;
    cartPasses(cart: Cart): void;
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

    colors = [  chalk.red, chalk.green, chalk.blue, chalk.yellow ];

    constructor(clock: Clock, output: (text: string) => void) {
        this.clock = clock;
        this.output = output;
    }

    private format(cart: Cart | null, text: string) {
        let line = `${this.clock.time}: ${text}`;
        if (cart) {
            line = this.colors[cart.id % this.colors.length](line);
        }
        this.output(line);
    }

    private color(cart: Cart, text: string): string {
        return this.colors[cart.id % this.colors.length](text);
    }

    cartDeparts(cart: Cart, destination: LocationId): void {
        this.format(cart, `Cart ${cart.id} departs location ${cart.lastKnownLocation} for location ${destination}.`);
    }

    cartPasses(cart: Cart): void {
        this.format(cart, `Cart ${cart.id} passes location ${cart.lastKnownLocation}.`);
    }

    cartArrives(cart: Cart): void {
        this.format(cart, `Cart ${cart.id} arrives at location ${cart.lastKnownLocation}.`);
    }

    cartWaits(cart: Cart, time: SimTime): void {
        this.format(cart, `Cart ${cart.id} waits until ${time}.`);
    }

    cartBeginsLoading(cart: Cart, quantity: number): void {
        this.format(cart, `Cart ${cart.id} begins loading ${quantity} items.`);
    }

    cartFinishesLoading(cart: Cart): void {
        this.format(cart, `Cart ${cart.id} finishes loading (payload=${cart.payload}).`);
    }

    cartBeginsUnloading(cart: Cart, quantity: number): void {
        this.format(cart, `Cart ${cart.id} begins unloading ${quantity} items.`);
    }

    cartFinishesUnloading(cart: Cart): void {
        this.format(cart, `Cart ${cart.id} finishes unloading (payload=${cart.payload}).`);
    }

    cartSuspendsService(cart: Cart): void {
        this.format(cart, `Cart ${cart.id} suspends service at location ${cart.lastKnownLocation}.`);
    }

    cartResumesService(cart: Cart): void {
        this.format(cart, `Cart ${cart.id} resumes service at location ${cart.lastKnownLocation}.`);
    }


    jobIntroduced(job: Job): void {
        this.format(null, `Job ${job.id} introduced.`);
    }

    jobAssigned(job: Job): void {
        // Hack to create dummy cart from job.assignedTo.
        const cart = job.assignedTo === null ? null : { id: job.assignedTo } as Cart; 
        this.format(cart, `Job ${job.id} assigned to cart ${job.assignedTo}.`);
    }

    jobSucceeded(job: Job): void {
        // Hack to create dummy cart from job.assignedTo.
        const cart = job.assignedTo === null ? null : { id: job.assignedTo } as Cart; 
        this.format(cart, `Job ${job.id} succeeded.`);
    }

    jobFailed(job: Job): void {
        // Hack to create dummy cart from job.assignedTo.
        const cart = job.assignedTo === null ? null : { id: job.assignedTo } as Cart; 
        this.format(cart, `Job ${job.id} failed.`);
    }

    plannerStarted(): void {
        this.format(null, `Planning cycle started.`);
    }

    plannerFinished(): void {
        this.format(null, `Planning cycle finished.`);
    }
}