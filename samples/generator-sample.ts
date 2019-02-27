import { Cart, Crew, HOUR, LocationId, Shift, SimTime, StaffingPlan, standardShift, adjustShift } from '../src';

function go() {
    const home: LocationId = 0;
    const breakRoom: LocationId = 7;
    const day: Shift = standardShift(8 * HOUR, home, breakRoom);
    const swing: Shift = adjustShift(day, 8 * HOUR);

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

    const staff = new StaffingPlan(crews);

    console.log('Carts:');
    for (const cart of staff.carts()) {
        console.log(`  Cart ${cart.id} starts at ${cart.lastKnownLocation}`);
    }

    console.log('Jobs:');
    for (const job of staff.jobs()) {
        console.log(`  Job ${job.id}: cart ${(job.assignedTo as Cart).id} suspends at ${job.suspendLocation} between ${formatTime(job.suspendTime)} and ${formatTime(job.resumeTime)}.`);
    }
}

function formatTime(time: SimTime) {
    const x = new Date(time);
    return x.toISOString().slice(11,16);
}

go();
