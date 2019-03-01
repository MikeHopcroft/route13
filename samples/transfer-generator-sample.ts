import { HOUR, MINUTE, TransferGenerator } from '../src';

function go() {
    const arrivalCount = 10;
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

    for (const job of generator.jobs()) {
        console.log(`    Job ${job.id}: move ${job.quantity} items from ${job.pickupLocation} to ${job.dropoffLocation} between ${job.pickupAfter} and ${job.dropoffBefore}`);
    }
}

go();
