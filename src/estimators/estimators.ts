import { SimTime } from '../core';
import { LocationId } from '../types';

// Returns the estimated time to travel from origin to destination, starting
// at startTime. Implementations could use a static table of historical travel
// times, or a more complex model that considers factors like current and
// anticipated congestion.
export type TransitTimeEstimator = (origin: LocationId, destination: LocationId, startTime: SimTime) => SimTime;
export type RouteNextStep = (origin: LocationId, destination: LocationId, startTime: SimTime) => LocationId;
export type LoadTimeEstimator = (location: LocationId, quantity: number, startTime: SimTime) => SimTime;
export type UnloadTimeEstimator = (location: LocationId, quantity: number, startTime: SimTime) => SimTime;
