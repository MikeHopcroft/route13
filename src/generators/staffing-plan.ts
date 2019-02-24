import { Clock, SimTime, start } from "../core";
import { Cart, CartFactory, Job, JobFactory, LocationId } from "../environement";

// Mapping from common time units to the milliseconds used by the Date class.
const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;

// An interval of time.
// The start time should never exceed the end ime.
interface Interval {
    start: SimTime;
    end: SimTime;
}

// Description of an out-of-service period during a shift.
// Breaks are to be taken at the specified location.
interface Break {
    interval: Interval;
    location: LocationId;
}

// Represents a work shift.
// Shift starts and ends at the home location.
// Breaks have intervals and locations specified.
interface Shift {
    working: Interval;

    // Breaks must obey the following conventions
    //   1. Breaks do not overlap.
    //   2. Breaks do not extend beyond working interval.
    //   3. Breaks ordered by increasing start time.
    breaks: Break[];
    home: LocationId;
}

// Represents a certain number of staff who all work the same shift.
interface Crew {
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
class StaffingPlan {
    private readonly clock: Clock;
    private readonly cartFactory: CartFactory;
    private readonly jobFactory: JobFactory;
    private readonly pauses: Job[];
    private readonly cartsByLocation: Map<LocationId, Cart[]>;
    private readonly cartCapacity = 10;

    constructor(crews: Crew[]) {
        this.clock = new Clock();
        this.cartFactory = new CartFactory();
        this.jobFactory = new JobFactory();
        this.pauses = [];
        this.cartsByLocation = new Map<LocationId, Cart[]>();

        start(this.generateJobs(crews));
        this.clock.mainloop();
    }

    // Generator of Carts to be added to the environment.
    *carts() {
        for (const [location, fleet] of this.cartsByLocation) {
            for (const cart of fleet) {
                yield cart;
            }
        }
    }

    // Generator of OutOfServiceJobs corresponding to breaks.
    jobs() {
        return this.pauses[Symbol.iterator]();
    }

    private *generateJobs(crews: Crew[]) {
        for (const crew of crews) {
            for (let i = 0; i < crew.size; ++i) {
                yield this.clock.until(crew.shift.working.start);
                const cart: Cart = this.allocateCart(crew.shift.home);

                for (const b of crew.shift.breaks) {
                    const job = this.jobFactory.outOfService(
                        b.location,
                        b.interval.start,
                        b.interval.end);
                    job.assignedTo = cart;
                    this.pauses.push(job);
                }

                yield this.clock.until(crew.shift.working.end);
                this.returnCart(cart);
            }
        }
    }

    private allocateCart(location: LocationId): Cart {
        const carts = this.cartsByLocation.get(location);
        if (carts !== undefined) {
            const cart = carts.pop();
            if (cart) {
                return cart;
            }
            else {
                return this.cartFactory.cart(this.cartCapacity, location);
            }
        }
        else {
            this.cartsByLocation.set(location, []);
            return this.cartFactory.cart(this.cartCapacity, location);
        }
    }

    private returnCart(cart: Cart) {
        const carts = this.cartsByLocation.get(cart.lastKnownLocation) as Cart[];
        carts.push(cart);
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
function standardShift(start: SimTime, home: LocationId, breakRoom: LocationId): Shift {
    return {
        working: interval(start, 0, 8 * HOUR),
        breaks: [
            // Morning break
            { interval: interval(start, 120 * MINUTE, 15 * MINUTE), location: breakRoom },

            // Lunch
            { interval: interval(start, 240 * MINUTE, 30 * MINUTE), location: breakRoom },

            // Afternoon break
            { interval: interval(start, 360 * MINUTE, 15 * MINUTE), location: breakRoom },

            // End of shift
            { interval: interval(start, 475 * MINUTE, 5 * MINUTE), location: home }
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
function adjustShift(shift: Shift, offset: number): Shift {
    return {
        working: adjustInterval(shift.working, offset),
        breaks: shift.breaks.map((x) => adjustBreak(x, offset)),
        home: shift.home
    };
}

