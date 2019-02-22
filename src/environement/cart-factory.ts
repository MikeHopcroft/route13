import { Cart, CartId, LocationId } from '../types';

export class CartFactory {
    nextId: CartId;

    constructor() {
        this.nextId = 0;
    }

    cart(capacity: number, lastKnownLocation: LocationId, payload:number = 0): Cart {
        return {
            id: this.nextId++,
            capacity,
            lastKnownLocation,
            payload
        };
    }
}
