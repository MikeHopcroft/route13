import { Cart, Crew, HOUR, Interval, LocationId, Shift, SimTime, StaffingPlan, standardShift, adjustShift, MIN_DATE, MAX_DATE } from '../src';

function go() {
    const home: LocationId = 0;
    const breakRoom: LocationId = 7;

    // Shifts
    const day: Shift = standardShift('Day Shift', 8 * HOUR, home, breakRoom);
    const swing: Shift = adjustShift('Swing Shift', day, 8 * HOUR);

    PrintShift(day);
    console.log('');
    PrintShift(swing);
    console.log('');

    const crews: Crew[] = [
        {
            shift: day,
            size: 3
        },
        {
            shift: swing,
            size: 2
        }
    ];

    console.log('Crews');
    for (const crew of crews) {
        console.log(`  ${crew.shift.name}: ${crew.size} employees`);
    }
    console.log('');

    const staff = new StaffingPlan(crews);

    console.log('Carts:');
    const carts = [...staff.carts()].sort( (a,b) => a.id - b.id );
    for (const cart of carts) {
        console.log(`  Cart ${cart.id} - home location is ${cart.lastKnownLocation}`);
    }
    console.log('');

    console.log('Jobs:');
    const jobs = [...staff.jobs()].sort( (a, b) => {
        if (a === b) {
            return 0;
        }
        else {
            const cartA = a.assignedTo as Cart;
            const cartB = b.assignedTo as Cart;
            if (cartA.id !== cartB.id) {
                return cartA.id - cartB.id;
            }
            else {
                return a.suspendTime - b.suspendTime;
            }
        }
    });

    let previousCart = undefined;
    for (const job of jobs) {
        const cart = job.assignedTo as Cart;
        if (cart !== previousCart) {
            console.log('');
            console.log(`Cart ${cart.id}`);
            previousCart = cart;
        }
        console.log(`  Job ${job.id}: cart ${(job.assignedTo as Cart).id} suspends at ${job.suspendLocation} between ${formatTime(job.suspendTime)} and ${formatTime(job.resumeTime)}.`);
    }
}

function formatTime(time: SimTime) {
    const x = new Date(time);
    if (x.valueOf() === MIN_DATE) {
        return "MIN";
    }
    else if (x.valueOf() === MAX_DATE) {
        return "MAX";
    }
    else {
        // const s = x.toISOString().slice(-16,-8);
        // return s;

        // const day = x.toISOString().slice(-16,-14);
        const time = x.toISOString().slice(-13,-8);
        return time;
        // return `${day} @ ${time}`;
    }
}

function formatInterval(interval: Interval) {
    return `${formatTime(interval.start)}-${formatTime(interval.end)}`;
}

function PrintShift(shift: Shift) {
    console.log(`${shift.name}: ${formatInterval(shift.working)}`);
    for (const b of shift.breaks) {
        console.log(`  break: ${formatInterval(b.interval)}`);
    }
}

go();
