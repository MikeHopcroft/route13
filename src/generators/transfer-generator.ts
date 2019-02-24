///////////////////////////////////////////////////////////////////////////////
//
// TransferGenerator
//
// Creates a set of TransferJobs corresponding to items that must be moved
// between arriving and departing vehicles (e.g. flights, vessels, trucks).
//
// DESIGN INTENT is to provide an easy means to configure a simulation based
// on synthetic events.
//
///////////////////////////////////////////////////////////////////////////////
export class TransferGenerator {
    // TODO: implement
}

// Generate random arrival-departure pair schedule.
// Walk through arrivals chronologically
//   Allocate available location or add location
//   Create random transfer jobs to random future departures allowing minimum transer time

// Controls
//   Arrival rate
//   Turnaround time
//   Item quantity per arrival
//   Job size distribution
//   Minimum transfer time