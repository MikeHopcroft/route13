import { Cart } from './cart';
import { AnyJob, OutOfServiceJob, TransferJob } from './job';
import { LocationId, SimTime } from './types';

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

export interface SuspendAction extends Action {
    job: OutOfServiceJob;
    type: ActionType.SUSPEND;
    location: LocationId;
    suspendTime: SimTime;
    resumeTime: SimTime;
}

export type AnyAction = TransferAction | SuspendAction;

export interface Plan {
    cart: Cart;
    actions: AnyAction[];
    score: number;
}
