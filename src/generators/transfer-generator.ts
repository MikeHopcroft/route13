import * as seedrandom from 'seedrandom';
import { Gaussian } from 'ts-gaussian';

import { Clock, NextStep, SimTime, start } from '../core';
import { JobFactory, LocationId, TransferJob } from '../environement';

export type JourneyId = number;

export interface Arrival {
    id: JourneyId;
    time: SimTime;
    location?: LocationId
    earliestConnection?: number;
}

export interface Departure {
    id: JourneyId;
    time: SimTime;
    location?: LocationId
}

export interface TurnAround {
    arrival: Arrival;
    departure: Departure;
    jobs: TransferJob[];
}

interface Berth {
    location: LocationId;
}

class IdFactory {
    nextId: number = 0;

    id(): number {
        return this.nextId++;
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// TransferGenerator
//
// Creates a set of TransferJobs corresponding to items that must be moved
// between arriving and departing vehicles (e.g. flights, vessels, trucks).
//
// DESIGN INTENT is to provide an easy means to configure a simulation based
// on synthetic events.
//
///////////////////////////////////////////////////////////////////////////////
export class TransferGenerator {
    private readonly turnAroundTime: SimTime;
    private readonly minConnectionTime: SimTime;
    private readonly maxItemsPerTransfer: number;

    private readonly distribution: Gaussian;
    private readonly random: seedrandom.prng;
    private readonly berthFactory: IdFactory;
    private readonly jobFactory: JobFactory;
    private readonly journeyFactory: IdFactory;
    private readonly clock: Clock;

    private readonly arrivals: Arrival[];
    private readonly departures: Departure[];
    private readonly turnArounds: TurnAround[];
    private readonly berths: LocationId[];

    private readonly transfers: TransferJob[];

    constructor(
        arrivalCount: number,
        latestArrivalTime: SimTime,
        turnAroundTime: SimTime,
        minConnectionTime: SimTime,
        maxTransfersPerJourney: number,
        maxItemsPerTransfer: number
    ) {
        this.minConnectionTime = minConnectionTime;
        this.maxItemsPerTransfer = maxItemsPerTransfer;
        this.turnAroundTime = turnAroundTime;

        this.distribution = new Gaussian(minConnectionTime * 1.5, minConnectionTime * minConnectionTime);
        this.random = seedrandom('seed1');
        this.berthFactory = new IdFactory();
        this.journeyFactory = new IdFactory();
        this.jobFactory = new JobFactory();
        this.clock = new Clock();

        this.arrivals = [];
        this.departures = [];
        this.turnArounds = [];

        this.berths = [];

        this.transfers = [];

        // Create random arrivals.
        for (let i = 0; i < arrivalCount; ++i) {
            this.arrivals.push(this.randomArrival(latestArrivalTime));
        }

        // Create turn-arounds that pair departures with each arrival.
        for (const arrival of this.arrivals) {
            const turnAround = this.randomTurnAround(arrival);
            this.turnArounds.push(turnAround);
            this.departures.push(turnAround.departure);
        }
        
        // Run a simulation to allocate and assign berths to turn-arounds.
        for (const turnAround of this.turnArounds) {
            start(this.assignBerth(turnAround));           
        }
        this.clock.mainloop();

        // Sort arrivals and departures by increasing time.
        this.arrivals.sort((a, b) => a.time - b.time);
        this.departures.sort((a, b) => a.time - b.time);

        // Determine the index of the earliest departure
        // that can connect with each arrival.
        this.determineEarliestConnections();

        for (const arrival of this.arrivals) {
            if (arrival.earliestConnection !== undefined) {
                console.log(`Arrive: ${arrival.time}: CONNECT ${arrival.earliestConnection} at ${this.departures[arrival.earliestConnection].time}`);
            }
            else {
                console.log(`Arrive: ${arrival.time}: NO CONNECTION`);
            }
        }

        // Generate random transfer jobs for each arrival.
        for (const turnAround of this.turnArounds) {
            const arrival = turnAround.arrival;
            for (const transfer of this.randomTransferJobs(arrival)) {
                if (transfer.id == 8 || transfer.id == 3) {
                    console.log(`job ${transfer.id} arrival ${arrival.id} to departure ${turnAround.departure.id}`);
                }
                this.transfers.push(transfer);
                turnAround.jobs.push(transfer);
            }
        }
        // for (const arrival of this.arrivals) {
        //     for (const transfer of this.randomTransferJobs(arrival)) {
        //         this.transfers.push(transfer);
        //     }
        // }
            // const transferCount = this.randomNaturalNumber(maxTransfersPerJourney - 1);
            // for (let i = 0; i < transferCount; ++i) {
            //     // TODO: do we want to avoid multiple transfers to the same LocationId?
            //     // yes();
            //     const transfer = this.randomTransferJob(arrival);
            //     if (transfer) {
            //         this.transfers.push(transfer);
            //     }
            //     else {
            //         // There is no departure late enough to allow
            //         // time for a transfer.
            //         break;
            //     }
            // }
    }

    // Returns the number of berths allocated to handle the set of TurnArounds.
    berthCount() {
        return this.berths.length;
    }

    // Generator of TransferJobs.
    jobs() {
        return this.transfers[Symbol.iterator]();
    }

    getTurnArounds() {
        return this.turnArounds[Symbol.iterator]();
    }

    private determineEarliestConnections() {
        if (this.departures.length > 0) {
            let earliestConnection = 0;
            for (const arrival of this.arrivals) {
                while (this.departures[earliestConnection].time - arrival.time < this.minConnectionTime) {
                    ++earliestConnection;
                    if (earliestConnection === this.departures.length) {
                        return;
                    }
                }
                arrival.earliestConnection = earliestConnection;
            }
        }
    }

    private *assignBerth(turnAround: TurnAround): IterableIterator<NextStep> {
        yield this.clock.until(turnAround.arrival.time);
        const berth = this.allocateRandomBerth();
        console.log(`Inbound #${turnAround.arrival.id} becomes outbound #${turnAround.departure.id} at location ${berth}`);
        turnAround.arrival.location = berth;
        turnAround.departure.location = berth;
        yield this.clock.until(turnAround.departure.time);
        this.releaseBerth(berth);
    }

    private allocateRandomBerth(): LocationId {
        let berth = this.berths.pop();
        if (berth === undefined) {
            return this.berthFactory.id();
        }
        else if (this,this.berths.length === 0) {
            return berth;
        }
        else {
            const index = this.randomInRange(0, this.berths.length);
            const temp = this.berths[index];
            this.berths[index] = berth;
            return temp;
        }
    }

    private releaseBerth(berth: LocationId) {
        this.berths.push(berth);
    }

    private randomArrival(latestArrivalTime: SimTime): Arrival {
        const id = this.journeyFactory.id();
        const time = this.randomInRange(0, latestArrivalTime);
        return { id, time };
    }

    private randomTurnAround(arrival: Arrival): TurnAround {
        const id = this.journeyFactory.id();
        const time = arrival.time + this.turnAroundTime;
        return {
            arrival,
            departure: { id, time },
            jobs: []
        }
    }


    private *randomTransferJobs(arrival: Arrival): IterableIterator<TransferJob> {
        if (arrival.earliestConnection !== undefined) {
            for (let i = arrival.earliestConnection; i < this.departures.length; ++i) {
                const departure = this.departures[i];
                if (arrival.location !== departure.location) {
                    const connectionTime = departure.time - arrival.time;
                    const p = this.distribution.pdf(connectionTime) / this.distribution.pdf(this.distribution.mean);
                    if (this.random() < p) {
                        // Pick random quantity of items to transfer.
                        const quantity = this.randomNaturalNumber(this.maxItemsPerTransfer);

                        const job = this.jobFactory.transfer(
                            quantity,
                            arrival.location as LocationId,
                            arrival.time,
                            departure.location as LocationId,
                            departure.time);

                        if (job.id === 3 || job.id === 8) {
                            console.log(`job ${job.id}: inbound #${arrival.id} at ${arrival.time} ==? ${job.pickupAfter} ${formatTime(job.pickupAfter)}`);
                            console.log(`    Job ${job.id}: move ${job.quantity} items from ${job.pickupLocation} to ${job.dropoffLocation} between ${formatTime(job.pickupAfter)} and ${formatTime(job.dropoffBefore)}`);
                            console.log('here');
                        }
                        yield job;
                    }
                }
            }
        }
        return null;
    }

    // private randomTransferJob(arrival: Arrival): TransferJob | null {
    //     if (arrival.earliestConnection !== undefined) {
    //         // Pick departure late enough in future to allow a transfer.
    //         const departure = this.departures[
    //             this.randomInRange(arrival.earliestConnection, this.departures.length)
    //         ];

    //         // Pick random quantity of items to transfer.
    //         const quantity = this.randomNaturalNumber(this.maxItemsPerTransfer);

    //         return this.jobFactory.transfer(
    //             quantity,
    //             arrival.location as LocationId,
    //             arrival.time,
    //             departure.location as LocationId,
    //             departure.time);
    //     }
    //     return null;
    // }

    // Returns random integer in range [start, end).
    private randomInRange(start:number, end:number) {
        if (end < start) {
            const message = "end must be less than start";
            throw TypeError(message);
        }
        return start + Math.floor(this.random() * (end - start));
    }

    // Returns a random natural number not exceeding max.
    private randomNaturalNumber(max: number) {
        if (max < 1) {
            const message = "max cannot be less than 1";
            throw TypeError(message);
        }
        return 1 + Math.floor(this.random() * max);
    }
}


// export class Gaussian {
//     private readonly mean: number;
//     private readonly dev: number;
//     private readonly a: number;
//     private readonly b: number;

//     constructor(mean: number, dev: number) {
//         this.mean = mean;
//         this.dev = dev;

//         this.a = 1/Math.sqrt(2 * Math.PI * dev * dev);
//         this.b = -1 / 2 / dev / dev;
//     }

//     p(x: number): number {
//         const c = x - this.mean;
//         return this.a * Math.exp(c * c * this.b);
//     }
// }

// TODO: delete this debugging function.
function formatTime(time: SimTime) {
    const x = new Date(time);
    return x.toISOString().slice(-13,-8);
}
