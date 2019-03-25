import { SimTime } from '../core';
import { LocationId } from '../environment';

// Returns the estimated time to travel from origin to destination, starting
// at startTime. Implementations could use a static table of historical travel
// times, or a more complex model that considers factors like current and
// anticipated congestion.
export type TransitTimeEstimator = (origin: LocationId, destination: LocationId, startTime: SimTime) => SimTime;

// Returns the next step on the path from `origin` to `destination` at a
// specified time. Note that the best next step may depend on the time.
export type RouteNextStep = (origin: LocationId, destination: LocationId, startTime: SimTime) => LocationId;

// Estimates the amount of time needed to load `quantity` items at a specific
// location. The load time may vary across locations, depending on available
// equipment and other factors.
export type LoadTimeEstimator = (location: LocationId, quantity: number, startTime: SimTime) => SimTime;

// Estimates the amount of time needed to unload `quantity` items at a specific
// location. The unload time may vary across locations, depending on available
// equipment and other factors.
export type UnloadTimeEstimator = (location: LocationId, quantity: number, startTime: SimTime) => SimTime;
