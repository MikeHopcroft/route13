import { SimTime } from '../core';
import { JobId, JobType } from '../environement';
import { OutOfServiceJob, OutOfServiceJobState, } from '../environement';
import { TransferJob, TransferJobState, } from '../environement';
import { LocationId } from '../types';

export class JobFactory {
    nextId: JobId;

    constructor() {
        this.nextId = 0;
    }

    outOfService(suspendLocation: LocationId, suspendTime: SimTime, resumeTime: SimTime) {
        return  {
            id: this.nextId++,
            type: JobType.OUT_OF_SERVICE,
            assignedTo: null,
    
            state: OutOfServiceJobState.BEFORE_BREAK,
            suspendLocation,
            suspendTime,
            resumeTime
        } as OutOfServiceJob;
    }
    
    transfer(
        quantity: number,
        pickupLocation: LocationId,
        pickupAfter: SimTime,
        dropoffLocation: LocationId,
        dropoffBefore: SimTime
    ) {
        return {
            id: this.nextId++,
            type: JobType.TRANSFER,
            assignedTo: null,
    
            state: TransferJobState.BEFORE_PICKUP,
            quantity,
            pickupLocation,
            pickupAfter,
            dropoffLocation,
            dropoffBefore
        } as TransferJob;   
    }
}