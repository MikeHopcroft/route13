import { HOUR, LocationId, MINUTE, SimTime, TransferGenerator, TransferJob } from '../src';
// import { Gaussian } from 'ts-gaussian';

// import { Gaussian } from '../src';

function go() {
    const arrivalCount = 20;
    const latestArrivalTime = 8 * HOUR;
    const turnAroundTime = 1 * HOUR;
    const minConnectionTime = 30 * MINUTE;
    const maxTransfersPerJourney = 5;
    const maxItemsPerTransfer = 5;

    const generator = new TransferGenerator(
        arrivalCount,
        latestArrivalTime,
        turnAroundTime,
        minConnectionTime,
        maxTransfersPerJourney,
        maxItemsPerTransfer);

    console.log(`Allocated ${generator.berthCount()} berths.`)

    const jobs = new Map<LocationId, TransferJob[]>();
    for (const job of generator.jobs()) {
        console.log(`    Job ${job.id}: move ${job.quantity} items from ${job.pickupLocation} to ${job.dropoffLocation} between ${formatTime(job.pickupAfter)} and ${formatTime(job.dropoffBefore)}`);
        const list = jobs.get(job.pickupLocation);
        if (list !== undefined) {
            list.push(job);
        }
        else {
            jobs.set(job.pickupLocation, [job]);
        }
    }

    const turnArounds = [...generator.getTurnArounds()].sort( (a, b) => {
        if (a === b) {
            return 0;
        }
        else if (a.arrival.location !== b.arrival.location) {
            return (a.arrival.location as LocationId) - (b.arrival.location as LocationId);
        }
        else {
            return a.arrival.time - b.arrival.time;
        }
    });

    let lastBerth = undefined;
    for (const turnAround of turnArounds) {
        const arrival = turnAround.arrival;
        if (arrival.location !== lastBerth) {
            console.log(`Berth ${arrival.location}`);
            lastBerth = arrival.location;
        }
        const departure = turnAround.departure;
        console.log(`  Inbound #${arrival.id} at ${formatTime(arrival.time)} => Outbound #${departure.id} at ${formatTime(departure.time)}`)
        for (const job of turnAround.jobs) {
            const transferTime = job.dropoffBefore - job.pickupAfter;
            console.log(`    Job ${job.id}: move ${job.quantity} items from ${job.pickupLocation} to ${job.dropoffLocation} between ${formatTime(job.pickupAfter)} and ${formatTime(job.dropoffBefore)} (${formatTime(transferTime)})`);
        }
        // const list = jobs.get(arrival.location as LocationId);
        // if (list != undefined) {
        //     for (const job of list) {
        //         console.log(`    Job ${job.id}: move ${job.quantity} items from ${job.pickupLocation} to ${job.dropoffLocation} between ${formatTime(job.pickupAfter)} and ${formatTime(job.dropoffBefore)}`);
        //     }
        // }
    }
}

function formatTime(time: SimTime) {
    const x = new Date(time);
    return x.toISOString().slice(-13,-8);
}


// function go2() {
//     const distribution = new Gaussian(1, .25);
//     // const g = new Gaussian(1, .25);
//     for (let x = 0; x < 2; x += 0.1) {
//         console.log(`${x.toPrecision(3)}: ${distribution.cdf(x)}`);
//     }
// }

go();
