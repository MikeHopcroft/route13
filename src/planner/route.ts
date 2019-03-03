import { SimTime } from '../core';
import { Cart, Job, LocationId, OutOfServiceJob, TransferJob } from '../environement';

///////////////////////////////////////////////////////////////////////////////
//
// Actions
//
// Actions are the smallest unit of work. Jobs and Plans consist of ordered
// sequences of Actions.
//
///////////////////////////////////////////////////////////////////////////////

export enum ActionType {
    PICKUP,
    DROPOFF,
    SUSPEND
}

// Common interface for Actions.
// NOTE: use type Action to limit choices to this Actions currently defined.
// Using Action, instead of ActionBase, will allow Typescript to restrict the
// type of an Action when its ActionType is known.
export interface ActionBase {
    job: Job;
    type: ActionType;
}

export interface TransferAction extends ActionBase {
    job: TransferJob;
    type: ActionType.DROPOFF | ActionType.PICKUP;
    location: LocationId;
    time: SimTime;
    quantity: number;
}

// PickupAction loads a cart with a quantity of items, at a certain location,
// after a time when the items become available.
export interface PickupAction extends TransferAction {
    type: ActionType.PICKUP;
}

// DropoffAction unloads a quantity of items from a cart, at a certain location,
// before a certain time.
export interface DropoffAction extends TransferAction {
    type: ActionType.DROPOFF;
}

// SuspendAction takes a cart out of service, at a certain location, within a
// window of time.
export interface SuspendAction extends ActionBase {
    job: OutOfServiceJob;
    type: ActionType.SUSPEND;
    location: LocationId;
    suspendTime: SimTime;
    resumeTime: SimTime;
}

export type Action = DropoffAction | PickupAction | SuspendAction;

///////////////////////////////////////////////////////////////////////////////
//
// Route
//
// A Route is an ordered sequence of Actions. Typically, the Actions that
// make up a Route are the union of the Actions associated with a number of
// Jobs.
//
// A Route represents the interleaving of Actions requires to perform a set
// of Jobs.
//
// Without the concept of a Route, it would not be possible to interleave the
// Actions of multiple Jobs. This would preclude opportunities like picking
// up items for Job B, while tranporting items for Job A, e.g.
//
//   Job A: pickup 5 at location 0
//   Job B: pickup 7 at location 3
//   Job A: dropoff 5 at location 4
//   Job B: dropoff 7 at location 5.
//
///////////////////////////////////////////////////////////////////////////////
export interface Route {
    cart: Cart;
    actions: Action[];
    workingTime: SimTime;
    score: number;
}
