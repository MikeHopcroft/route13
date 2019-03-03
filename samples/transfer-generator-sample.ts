import { HOUR, MINUTE, SimTime, TransferGenerator } from '../src';


function go() {
    const arrivalCount = 20;
    const latestArrivalTime = 8 * HOUR;
    const turnAroundTime = 1 * HOUR;
    const minConnectionTime = 30 * MINUTE;
    const maxItemsPerTransfer = 5;

    const generator = new TransferGenerator(
        arrivalCount,
        latestArrivalTime,
        turnAroundTime,
        minConnectionTime,
        maxItemsPerTransfer);

    console.log(`Allocated ${generator.berthCount()} berths.`)
    console.log(`${generator.getTurnAroundCount()} arrival-departure pairs.`);
    console.log(`${generator.getJobCount()} jobs.`);
    console.log('');

    let lastBerth = undefined;
    for (const turnAround of generator.getTurnArounds()) {
        const arrival = turnAround.arrival;
        if (arrival.location !== lastBerth) {
            console.log('');
            console.log(`Berth ${arrival.location}`);
            lastBerth = arrival.location;
        }
        const departure = turnAround.departure;
        console.log(`  Inbound #${arrival.id} at ${formatTime(arrival.time)} => Outbound #${departure.id} at ${formatTime(departure.time)}`)
        for (const job of turnAround.jobs) {
            const transferTime = job.dropoffBefore - job.pickupAfter;
            console.log(`    Job ${job.id}: move ${job.quantity} items from ${job.pickupLocation} to ${job.dropoffLocation} between ${formatTime(job.pickupAfter)} and ${formatTime(job.dropoffBefore)} (${formatTime(transferTime)})`);
        }
    }
}

function formatTime(time: SimTime) {
    const x = new Date(time);
    return x.toISOString().slice(-13,-8);
}

go();
