import { Clock, HOUR, MAX_DATE, MINUTE, MIN_DATE, SECOND, SimTime, start } from "../core";
import { Cart, CartFactory, JobFactory, LocationId, OutOfServiceJob, Job } from "../environment";

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
// Breaks specify their time intervals and locations.
export interface Shift {
    name: string,
    working: Interval;

    // Breaks must obey the following conventions
    //   1. Breaks do not overlap.
    //   2. Breaks properly contained by working interval.
    //
    //   TODO: REVIEW: following condition may be unnecessary.
    //   3. Breaks ordered by increasing start time.
    breaks: Break[];
    home: LocationId;
}

// Represents a certain number of staff who all work the same shift.
export interface Crew {
    shift: Shift;
    size: number;
}

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
    private readonly clock: Clock;
    private readonly cartFactory: CartFactory;
    private readonly jobFactory: JobFactory;

    private readonly cartCapacity = 10;

    private readonly cartsWaiting: Map<LocationId, OutOfServiceJob[]>;
    private readonly allCarts: Cart[];
    private readonly breakPeriods: OutOfServiceJob[];

    constructor(crews: Crew[]) {
        this.clock = new Clock();
        this.cartFactory = new CartFactory();
        this.jobFactory = new JobFactory();
        
        this.cartsWaiting = new Map<LocationId, OutOfServiceJob[]>();
        this.allCarts = [];
        this.breakPeriods = [];

        this.generateAllShifts(crews);

        // Run simple shift worker simulation to allocate and assign carts for
        // each worker on each shift.
        this.clock.mainloop();
    }

    // Generator of Carts to be added to the environment.
    *carts(): IterableIterator<Cart> {
        for (const [location, fleet] of this.cartsWaiting) {
            for (const cart of fleet) {
                yield cart.assignedTo as Cart;
            }
        }
    }

    // Generator of OutOfServiceJobs corresponding to breaks.
    jobs(): IterableIterator<OutOfServiceJob> {
        return this.breakPeriods[Symbol.iterator]();
    }

    private generateAllShifts(crews: Crew[]) {
        for (const crew of crews) {
            for (let i = 0; i < crew.size; ++i) {
                start(this.generateOneShift(crew.shift));
            }
        }
    }

    private *generateOneShift(shift: Shift) {
        // Wait until the shift begins.
        yield this.clock.until(shift.working.start);

        // Find an available cart and get its final OutOfServiceJob.
        const endOfLastShift = this.allocateCart(shift.home);

        // Get the cart from the job. For these jobs, assignedTo is never null.
        const cart = endOfLastShift.assignedTo as Cart;

        // Update this Job's resume time from MAX_DATE to the start of the
        // current shift.
        endOfLastShift.resumeTime = shift.working.start;

        // Create a new OutOfService job for the end of the shift.
        const endOfCurrentShift = this.createJob(cart, shift.home, shift.working.end, MAX_DATE);

        // Create an OutOfServiceJob for each break period.
        for (const b of shift.breaks) {
            this.createJob(cart, b.location, b.interval.start, b.interval.end);
        }

        // Wait until the shift has ended.
        yield this.clock.until(shift.working.end);

        // Hand the cart back to the pool.
        this.returnCart(endOfCurrentShift);
    }

    // Returns the OutOfServiceJob for an available cart with the specified
    // home location. Creates a new cart, if none are currently available.
    private allocateCart(home: LocationId): OutOfServiceJob {
        const waiting = this.cartsWaiting.get(home);
        if (waiting !== undefined) {
            // At least one cart has this location as its home.
            const cart = waiting.pop();
            if (cart) {
                // One of these carts was available.
                return cart;
            }
            else {
                // None of these carts was available, so create a new one.
                return this.createCart(home);
            }
        }
        else {
            // Have not previously created a cart with this home location.
            this.cartsWaiting.set(home, []);    // TODO: this should be done one return.
            return this.createCart(home);
        }
    }

    // Returns thd OutOfServiceJob for a newly created cart.
    private createCart(home: LocationId): OutOfServiceJob {
        // Create a cart.
        const cart = this.cartFactory.cart(this.cartCapacity, home);

        // Add it to the master list of carts.
        this.allCarts.push(cart);

        // Initially cart is out of service for all time.
        const outOfService = this.createJob(cart, home, MIN_DATE, MAX_DATE);

        return outOfService;
    }

    // Place a cart back into the pool of available carts with a certain home
    // location.
    private returnCart(job: OutOfServiceJob) {
        const cart = job.assignedTo as Cart;
        const jobs = this.cartsWaiting.get(cart.lastKnownLocation) as OutOfServiceJob[];
        jobs.push(job);
    }

    // Create and OutOfServiceJob, assign it to a cart, and add it to the
    // master list of break periods.
    private createJob(cart: Cart, suspendLocation: LocationId, suspendTime: SimTime, resumeTime: SimTime): OutOfServiceJob {
        const job = this.jobFactory.outOfService(suspendLocation, suspendTime, resumeTime);
        job.assignedTo = cart;
        this.breakPeriods.push(job);
        return job;
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
export function standardShift(name: string, start: SimTime, home: LocationId, breakRoom: LocationId): Shift {
    return {
        name: name,
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
export function adjustShift(name: string, shift: Shift, offset: number): Shift {
    return {
        name,
        working: adjustInterval(shift.working, offset),
        breaks: shift.breaks.map((x) => adjustBreak(x, offset)),
        home: shift.home
    };
}

// Returns true iff outer properly contains inner.
function contains(outer: Interval, inner: Interval): boolean {
    return (
        outer.start < inner.start &&
        outer.start < inner.end &&
        outer.end > inner.start &&
        outer.end > inner.end);
}

