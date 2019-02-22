import { LocationId } from './types';

///////////////////////////////////////////////////////////////////////////////
//
// Carts
//
///////////////////////////////////////////////////////////////////////////////

export type CartId = number;

// A Cart transports items from one location to another.
export interface Cart {
    id: CartId;

    // Cart capacity could be number of boxes/containers, tons, gallons, etc.
    capacity: number;

    // Amount of capacity currenty in use.
    payload: number;

    // Last known location of the cart.
    lastKnownLocation: LocationId;

    // DESIGN NOTE: information about jobs currently assigned to a cart is
    // encoded in the Job data structure. Don't want to duplicate this
    // information here to avoid inconsistencies.
    // ISSUE: Cart payload could still be inconsistent with current jobs.
    // We could infer the payload from the jobs. Not sure where this
    // information should reside. There is an argument for not storing the
    // payload quantity with the cart, and that is that we don't anticipate
    // a way to measure this quantity.
    //
    // Could measure the location with GPS tracker.
    // Could measure the payload with RFID, or on/off scans.
}
