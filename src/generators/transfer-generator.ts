import * as seedrandom from 'seedrandom';

import { Clock, NextStep, SimTime, start } from '../core';
import { JobFactory, LocationId, TransferJob } from '../environement';

type JourneyId = number;

interface Arrival {
    id: JourneyId;
    time: SimTime;
    location?: LocationId
    earliestConnection?: number;
}

interface Departure {
    id: JourneyId;
    time: SimTime;
    location?: LocationId
}

interface TurnAround {
    arrival: Arrival;
    departure: Departure;
    // location?: LocationId;
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

        this.random = seedrandom('seed');
        this.berthFactory = new IdFactory();
        this.journeyFactory = new IdFactory();
        this.jobFactory = new JobFactory();
        this.clock = new Clock();

        this.arrivals = [];
        this.departures = [];
        this.turnArounds = [];

        this.berths = [];

        this.transfers = [];

        // Creat random arrivals.
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

        // Generate random transfer jobs for each arrival.
        for (const arrival of this.arrivals) {
            const transferCount = this.randomNaturalNumber(maxTransfersPerJourney - 1);
            for (let i = 0; i < transferCount; ++i) {
                const transfer = this.randomTransferJob(arrival);
                if (transfer) {
                    this.transfers.push();
                }
                else {
                    // There is no departure late enough to allow
                    // time for a transer.
                    break;
                }
            }
        }
    }

    determineEarliestConnections() {
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

    private *assignBerth(turnAround: TurnAround): IterableIterator<NextStep> {
        yield this.clock.until(turnAround.arrival.time);
        const berth = this.allocateRandomBerth();
        turnAround.arrival.location = berth;
        turnAround.departure.location = berth;
    }

    private allocateRandomBerth(): LocationId {
        let berth = this.berths.pop();
        if (berth === undefined) {
            return this.berthFactory.id();
        }
        else {
            const index = Math.floor(this.random() * this.berths.length);
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
        const time = Math.floor(this.random() * latestArrivalTime);
        return { id, time };
    }

    private randomTurnAround(arrival: Arrival): TurnAround {
        const id = this.journeyFactory.id();
        const time = this.turnAroundTime;
        return {
            arrival,
            departure: { id, time }
        }
    }

    private randomTransferJob(arrival: Arrival): TransferJob | null {
        if (arrival.earliestConnection !== undefined) {
            // Pick departure late enough in future to allow a transfer.
            const departure = this.departures[
                this.randomInRange(arrival.earliestConnection, this.departures.length)
            ];

            // Pick random quantity of items to transfer.
            const quantity = Math.floor(this.random() * this.maxItemsPerTransfer);

            return this.jobFactory.transfer(
                quantity,
                arrival.location as number,
                arrival.time,
                departure.location as number,
                departure.time);
        }
        return null;
    }

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

// Generate random arrival-departure pair schedule.
// Walk through arrivals chronologically
//   Allocate available location or add location
//   Create random transfer jobs to random future departures allowing minimum transer time

// Controls
//   Arrival rate
//   Turnaround time
//   Item quantity per arrival
//   Job size distribution
//   Minimum transfer time