import chalk, { Chalk, ColorSupport } from 'chalk';

import { Clock, SimTime } from '../core';
import { Cart, Job, LocationId } from '../environement';

///////////////////////////////////////////////////////////////////////////////
//
// The Trace interface provides methods for agents, dispatchers, and the
// environment to log information about the progress of the simultion.
// DESIGN NOTE: using a structured tracing API (instead of free form text)
// allows other programs to analyze traces that would be too long for humans
// to understand.
//
///////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////
//
// The TextTrace class logs trace information to the console in human-readable,
// colorized format. In the output, lines relating to the same Cart will have
// the same color.
//
// NOTE: the Chalk package is used to provide colors in the console output.
// Node must be started with "--colors" command-line argument to enable the
// display of colored text. Here's an example launch.json fragment:
// {
//     "type": "node",
//     "request": "launch",
//     "name": "Simulator demo",
//     "program": "${workspaceFolder}/build/samples/simulator-demo.js",
//     "args": [ "--colors" ]
// }
///////////////////////////////////////////////////////////////////////////////
export class TextTrace implements Trace {
    clock: Clock;
    output: (text: string) => void;

    colors = [
        chalk.red,
        chalk.green,
        chalk.blue,
        chalk.yellow,
        chalk.magenta,
        chalk.cyan,
        chalk.redBright,
        chalk.greenBright,
        chalk.blueBright,
        chalk.yellowBright,
        chalk.magentaBright,
        chalk.cyanBright
    ];

    // TextTrace constructor parameters:
    // clock
    //    Used to display current time at the start of each line.
    // output
    //    Function to display output. Use console.log to display
    //    to the console.
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
        this.format(job.assignedTo, `Job ${job.id} assigned to cart ${(job.assignedTo as Cart).id}.`);
    }

    jobSucceeded(job: Job): void {
        this.format(job.assignedTo, `Job ${job.id} succeeded.`);
    }

    jobFailed(job: Job): void {
        this.format(job.assignedTo, `Job ${job.id} failed.`);
    }

    plannerStarted(): void {
        this.format(null, `Planning cycle started.`);
    }

    plannerFinished(): void {
        this.format(null, `Planning cycle finished.`);
    }
}
