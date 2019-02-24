import { SimTime } from '../core';
import { LocationId } from '../environement';

import { Cart } from './cart';

///////////////////////////////////////////////////////////////////////////////
//
// Jobs
//
///////////////////////////////////////////////////////////////////////////////

export type JobId = number;

export enum JobType {
    OUT_OF_SERVICE,
    TRANSFER
}

export interface JobBase {
    id: JobId;
    type: JobType;

    assignedTo: Cart | null;
}

// The OutOfServiceJob is mandatory and the scheduler treats it as a
// constraint. A valid plan must incorporate sufficient transit time
// to reach the suspendLocation before the suspendTime. Subsequent
// will not be processed until the resumeTime.
//
// DESIGN NOTE: Modeling out-of-service as a job, instead of a cart
// characteristic in order to easily model brief out-of-service periods like
// refueling. We want the planner to be able to anticipate carts resuming
// service.

export enum OutOfServiceJobState {
    BEFORE_BREAK,
    ON_BREAK
}

export interface OutOfServiceJob extends JobBase {
    type: JobType.OUT_OF_SERVICE;

    state: OutOfServiceJobState;

    suspendLocation: LocationId;
    suspendTime: SimTime;
    resumeTime: SimTime;
}

export enum TransferJobState {
    BEFORE_PICKUP,
    ENROUTE
}

// A valid plan must satisfy the following conditions:
//   1. Pickup not before pickupAfter time.
//   2. Sufficient time to load, travel to dropoffLocation, and unload before
//      dropoffBefore time.
//   3. Cart capacity not exceeded.
export interface TransferJob extends JobBase {
    type: JobType.TRANSFER;

    state: TransferJobState;

    quantity: number;

    // ISSUE: should we specify intervals for pickup and dropoff?
    pickupLocation: LocationId;
    pickupAfter: SimTime;

    dropoffLocation: LocationId;
    dropoffBefore: SimTime;
}

export type Job = OutOfServiceJob | TransferJob;

