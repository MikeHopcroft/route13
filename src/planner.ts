
type Id = number;
type LocationId = number;
type SimTime = number;
type CartId = number;

interface Job {
    id: Id;
    quantity: number;
    origin: LocationId;
    destination: LocationId;
    deadline: SimTime
}

// DESIGN NOTES
/*
Need some way to constrain new plan proposals to satisfy in-progress plan elements.
For example, if a plan involves jobs a, b, and c, and job a has already been picked
up, new plans should contain job a.

Need some way to constrain new plan proposals to satisfy constraints like planned
out-of-service times.

Need some way to track progress of jobs.
    Before origin
    Between origin and destination
    Complete
*/

interface Cart {
    id: CartId;
    capacity: number;
    loaded: number;
    lastKnownLocation: LocationId;
}

interface Plan {
    cart: CartId;           // Should this be a reference to Cart?
    route: LocationId[];
    jobs: Job[];
    score: number;
}

/*
Proposed algorithm

for each cart
    for each {a,b,c,..} subset of jobs
        create plan(cart, [a,b,c])
            for each permutation of destinations
                exclude if capacity is exceeded
                exclude if deadlines not fulfilled
                find best scoring plan
        add plan to priority queue
        add plan to each job => plan list mapping

// Greedy assign boulders
while (some criteria)    // more carts to assign, value of remaining plans adequate
    pull first plan from priority queue
    assign plan to cart
        this involves marking plamn's jobs as assigned
        marking plan itself as assigned
        removing all conflicting plans from consideration

// Backfill with sand
// Either pick carts and assign most valuable add-on job
// or pick jobs and find best cart to assign
for each assigned plan in order of decreasing elapsed time

*/

