import { SimTime } from '../core';
import { AnyJob, Cart, OutOfServiceJob, TransferJob } from '../environement';
import { LocationId } from '../types';

///////////////////////////////////////////////////////////////////////////////
//
// Plans and Actions
//
///////////////////////////////////////////////////////////////////////////////

export enum ActionType {
    PICKUP,
    DROPOFF,
    SUSPEND
}

export interface Action {
    job: AnyJob;
    type: ActionType;
}

export interface TransferAction extends Action {
    job: TransferJob;
    type: ActionType.DROPOFF | ActionType.PICKUP;
    location: LocationId;
    time: SimTime;
    quantity: number;
}

export interface PickupAction extends TransferAction {
    type: ActionType.PICKUP;
}

export interface DropoffAction extends TransferAction {
    type: ActionType.DROPOFF;
}

export interface SuspendAction extends Action {
    job: OutOfServiceJob;
    type: ActionType.SUSPEND;
    location: LocationId;
    suspendTime: SimTime;
    resumeTime: SimTime;
}

export type AnyAction = DropoffAction | PickupAction | SuspendAction;

export interface Plan {
    cart: Cart;
    actions: AnyAction[];
    score: number;
}
