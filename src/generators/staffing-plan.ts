import { Clock, SimTime, start } from "../core";
import { Cart, CartFactory, JobFactory, LocationId, OutOfServiceJob, Job } from "../environement";

// Mapping from common time units to the milliseconds used by the Date class.
export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;

export const MIN_DATE = -8640000000000000;
export const MAX_DATE = 8640000000000000;

// An interval of time.
// The start time should never exceed the end ime.
export interface Interval {
    start: SimTime;
    end: SimTime;
}

// Description of an out-of-service period during a shift.
// Breaks are to be taken at the specified location.
export interface Break {
    interval: Interval;
    location: LocationId;
}

// Represents a work shift.
// Shift starts and ends at the home location.
// Breaks have intervals and locations specified.
export interface Shift {
    working: Interval;

    // Breaks must obey the following conventions
    //   1. Breaks do not overlap.
    //   2. Breaks do not extend beyond working interval.
    //   3. Breaks ordered by increasing start time.
    breaks: Break[];
    home: LocationId;
}

// Represents a certain number of staff who all work the same shift.
export interface Crew {
    shift: Shift;
    size: number;
}

function contains(outer: Interval, inner: Interval): boolean {
    return (
        outer.start < inner.start &&
        outer.start < inner.end &&
        outer.end > inner.start &&
        outer.end > inner.end);
}

// class CartSchedule {
//     private readonly cartFactory: CartFactory;
//     private readonly jobFactory: JobFactory;
//     private readonly inService: Interval;
//     private readonly home: LocationId;

//     private readonly cart: Cart;
//     readonly jobs: OutOfServiceJob[];

//     constructor(
//         cartFactory: CartFactory,
//         jobFactory: JobFactory,
//         capacity: number,
//         home: LocationId,
//         inService: Interval
//     ) {
//         this.jobFactory = jobFactory;
//         this.inService = inService;
//         this.home = home;

//         this.cart = cartFactory.cart(capacity, home);
//         const before = jobFactory.outOfService(home, MIN_DATE, inService.start);
//         before.assignedTo = this.cart;
//         const after = jobFactory.outOfService(home, inService.end, MAX_DATE);
//         after.assignedTo = this.cart;
//         this.jobs = [ before, after ];
//     }

//     outOfService(suspended: Interval, location: LocationId) {
//         if (!contains(this.inService, suspended)) {
//             const message = 'Out of service interval must be contained by in service interval.';
//             throw TypeError(message);
//         }

//         const job = this.jobFactory.outOfService(location, suspended.start, suspended.end);
//         job.assignedTo = this.cart;
//         this.jobs.push(job);
//     }
// }

///////////////////////////////////////////////////////////////////////////////
//
// StaffingPlan
//
// Creates a fleet of Carts and a set of OutOfServiceJobs corresponding to
// worker break times.
//
// DESIGN INTENT is to provide an easy means to configure a simulation based
// on synthetic events.
//
///////////////////////////////////////////////////////////////////////////////
export class StaffingPlan {
    private readonly inService: Interval;
    private readonly clock: Clock;
    private readonly cartFactory: CartFactory;
    private readonly jobFactory: JobFactory;
    private readonly pauses: OutOfServiceJob[];

    private readonly allCarts: Cart[];
    private readonly cartsByLocation: Map<LocationId, OutOfServiceJob[]>;
    private readonly cartCapacity = 10;

    constructor(inService: Interval, crews: Crew[]) {
        this.inService = inService;
        this.clock = new Clock();
        this.cartFactory = new CartFactory();
        this.jobFactory = new JobFactory();
        this.pauses = [];

        this.allCarts = [];
        this.cartsByLocation = new Map<LocationId, OutOfServiceJob[]>();

        this.generateAllShifts(crews);

        // Allocate and assign carts for each worker on each Shift.
        this.clock.mainloop();

        // TODO: the factory should add jobs to the list.
        // Also, can compute inservice period from staffing plans associated with crews
        // compileError();
        // for (const [location, carts] of this.cartsByLocation.entries()) {
        //     for (const cart of carts) {
        //         for (const job of cart.jobs) {
        //             this.pauses.push(job);
        //         }
        //     }
        // }
    }

    private createJob(suspendLocation: LocationId, suspendTime: SimTime, resumeTime: SimTime): OutOfServiceJob {
        const job = this.jobFactory.outOfService(suspendLocation, suspendTime, resumeTime);
        this.pauses.push(job);
        return job;
    }

    // Generator of Carts to be added to the environment.
    *carts(): IterableIterator<Cart> {
        for (const [location, fleet] of this.cartsByLocation) {
            for (const cart of fleet) {
                // We know that jobs in this.cartsByLocation are always assigned.
                // (never null)
                yield cart.assignedTo as Cart;
            }
        }
    }

    // Generator of OutOfServiceJobs corresponding to breaks.
    jobs() {
        return this.pauses[Symbol.iterator]();
    }

    private generateAllShifts(crews: Crew[]) {
        for (const crew of crews) {
            for (let i = 0; i < crew.size; ++i) {
                start(this.generateOneShift(crew.shift));
            }
        }
    }

    private *generateOneShift(shift: Shift) {
        yield this.clock.until(shift.working.start);

        // AllocateCart returns the final OutOfServiceJob for a cart.
        // Update its resume time from MAX_DATE to the start of the shift.
        const endOfLastShift = this.allocateCart(shift.home);
        if (endOfLastShift.resumeTime !== MAX_DATE) {
            // const message = 'Next Shift must start after previous Shift ends.';
            // THIS IS A BUG
            const message = "Expected job to resume at MAX_DATE";
            throw TypeError(message);
        }
        endOfLastShift.resumeTime = shift.working.start;

        if (!endOfLastShift.assignedTo) {
            const message = "Expected cart assignment"
            throw TypeError(message);
        }
        const cart = endOfLastShift.assignedTo;

        // Create a new OutOfService job for the end of the shift.
        const endOfCurrentShift = this.jobFactory.outOfService(shift.home, shift.working.end, MAX_DATE);
        endOfCurrentShift.assignedTo = cart;
        this.pauses.push(endOfCurrentShift);

        // Add and OutOfServiceJob for each break.
        for (const b of shift.breaks) {
            if (!contains(shift.working, b.interval)) {
                const message = 'Out of service interval must be contained by in service interval.';
                throw TypeError(message);
            }
    
            const breakPeriod = this.jobFactory.outOfService(b.location, b.interval.start, b.interval.end);
            breakPeriod.assignedTo = cart;
            this.pauses.push(breakPeriod);
        }

        yield this.clock.until(shift.working.end);
        this.returnCart(endOfCurrentShift);
    }

    private allocateCart(location: LocationId): OutOfServiceJob {
        const carts = this.cartsByLocation.get(location);
        if (carts !== undefined) {
            const cart = carts.pop();
            if (cart) {
                return cart;
            }
            else {
                return this.createCart(location);
            }
        }
        else {
            this.cartsByLocation.set(location, []);
            return this.createCart(location);
        }
    }

    private createCart(home: LocationId): OutOfServiceJob {
        const cart = this.cartFactory.cart(this.cartCapacity, home);
        this.allCarts.push(cart);

        const outOfService = this.jobFactory.outOfService(home, MIN_DATE, MAX_DATE);
        outOfService.assignedTo = cart;
        this.pauses.push(outOfService);
        // const before = this.jobFactory.outOfService(home, MIN_DATE, this.inService.start);
        // before.assignedTo = cart;
        // this.pauses.push(before);
        // const after = this.jobFactory.outOfService(home, this.inService.end, MAX_DATE);
        // after.assignedTo = cart;
        // this.pauses.push(after);

        return outOfService;
    }

    private returnCart(job: OutOfServiceJob) {
        const cart = job.assignedTo as Cart;
        const jobs = this.cartsByLocation.get(cart.lastKnownLocation) as OutOfServiceJob[];
        jobs.push(job);
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// Utility functions relating to Shift construction.
//
///////////////////////////////////////////////////////////////////////////////

// Constructs a standard 8 hour shift with the following out-of-service periods:
//   15 minute morning break after 2 hours - in break room
//   30 minute lunch break after 4 hours - in break room
//   15 minute afternoon break after 6 hours - in break room
//    5 minute return to base after 7:55 - at home location
export function standardShift(start: SimTime, home: LocationId, breakRoom: LocationId): Shift {
    return {
        working: interval(start, 0, 8 * HOUR - 1),
        breaks: [
            // Morning break
            { interval: interval(start, 120 * MINUTE, 15 * MINUTE), location: breakRoom },

            // Lunch
            { interval: interval(start, 240 * MINUTE, 30 * MINUTE), location: breakRoom },

            // Afternoon break
            { interval: interval(start, 360 * MINUTE, 15 * MINUTE), location: breakRoom }

            // // End of shift
            // // TODO: consider alternatives to the following hack.
            // // NOTE: End shift one unit of time early so that cart return will
            // // be processed before next shift allocates a cart.
            // { interval: interval(start, 475 * MINUTE, 5 * MINUTE - 2), location: home }
        ],
        home
    }
}

// Constructs an Interval.
function interval(base: SimTime, offset: SimTime, length: SimTime): Interval {
    return {
        start: base + offset,
        end: base + offset + length
    };
}

// Moves an Interval in time.
function adjustInterval(interval: Interval, offset: number): Interval {
    return {
        start: interval.start + offset,
        end: interval.end + offset
    };
}

// Moves a Break in time.
function adjustBreak(b: Break, offset: SimTime): Break {
    return {
        interval: adjustInterval(b.interval, offset),
        location: b.location
    };
}

// Moves a Shift in time.
export function adjustShift(shift: Shift, offset: number): Shift {
    return {
        working: adjustInterval(shift.working, offset),
        breaks: shift.breaks.map((x) => adjustBreak(x, offset)),
        home: shift.home
    };
}

