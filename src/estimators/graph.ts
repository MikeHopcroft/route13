// Vertex in graph.
export type Vertex = number;

// Directed edge in graph.
export interface Edge {
    from: Vertex;
    to: Vertex;
    weight: number;
}

export type Logger = (text: string) => void;

// Graph uses the Floyd-Warshall algorithm to provide
//   1. Minimum cost of a path between two vertices in a directed graph with
//      weighted edges.
//   2. Next vertex on a minimum cost path.
//   3. Sequence of vertices along minimum cost path.
//
export class Graph {
    vertexCount: number;
    logger: Logger | null;

    distance: number[][];
    next: (Vertex|null)[][];

    // Graph constructor uses the Floyd-Warshall algorithm to construct the
    // `distance` and and `next` matrices.
    //
    // vertexCount
    //   The number of vertices in the graph.
    //   Vertices numbers are in the range [0, vertexCount).
    //
    // edges
    //   A collection of directed, weighted edges linking graph vertices.
    //   NOTE that edge weights can be zero or negative, but the graph
    //   cannot contain negative weighted cycles.
    //
    // logger
    //   Optional logger prints out human-readable debugging spew.
    //
    // DESIGN NOTE: the Floyd-Warshall used here generates n x n matrices.
    // Because these matrices use quadratic space, they are only approprate
    // for smaller graphs. These matrices will be wasteful for sparse graphs.
    constructor(vertexCount: number, edges: Iterable<Edge>, logger: Logger | null = null) {
        this.vertexCount = vertexCount;
        this.logger = logger;

        // Create distance and next matrices.
        const distance = new Array(vertexCount);
        this.distance = distance;

        const next: (Vertex|null)[][] = new Array(vertexCount);
        this.next = next;

        for (let i = 0; i < vertexCount; ++i) {
            distance[i] = new Array(vertexCount);
            next[i] = new Array(vertexCount);
            for (let j = 0; j < vertexCount; ++j) {
                distance[i][j] = Infinity;
                next[i][j] = null;
            }
            // Following line missing in Wikipedia page
            //   https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm.
            distance[i][i] = 0;
        }

        // Record initial edge weights.
        for (const edge of edges) {
            distance[edge.from][edge.to] = edge.weight;
            next[edge.from][edge.to] = edge.to;
        }

        // Main loop finds shortest path from `a` to `b` passing through vertex in {0,...k}.
        for (let k = 0; k < vertexCount; ++k) {
            for (let i = 0; i < vertexCount; ++i) {
                for (let j = 0; j < vertexCount; ++j) {
                    const d = distance[i][k] + distance[k][j];
                    if (distance[i][j] > d) {
                        distance[i][j] = d;
                        next[i][j] = next[i][k];
                    }
                }
            }
            if (this.logger) {
                this.print(k, this.logger);
            }
        }
    }

    // Returns the cost of the least expensive path between two vertices.
    // Will return Infinity if no path exists.
    cost(from: Vertex, to: Vertex): number {
        return this.distance[from][to];
    }

    // Returns the next vertex along the least expensive path between two
    // vertices. Will return null if no path exists.
    nextVertex(from: Vertex, to: Vertex): Vertex | null {
        return this.distance[from][to];
    }

    // Returns the least expensive path between two vertices.
    // The path does not contain the starting vertex, but it does include
    // the final vertex. Returns null if no path exists.
    path(from: Vertex, to: Vertex): Vertex[] {
        if (this.next[from][to] === null) {
            return [];
        }
        // const path = [from];
        const path = [];
        while (from !== to) {
            from = this.next[from][to] as Vertex;
            path.push(from);
        }
        return path;
    }

    // Debugging function prints the cost and next matrices.
    print(iteration: number, logger: Logger) {
        logger(`=== Iteration ${iteration} ===`);
        logger('Distances');
        for (let i = 0; i < this.vertexCount; ++i) {
            logger(`${i}: ${this.distance[i].join(', ')}`);
        }
    
        logger('');
    
        logger('Next');
        for (let i = 0; i < this.vertexCount; ++i) {
            logger(`${i}: ${this.next[i].map((v) => (v != null)?v:'x').join(' ')}`);
        }

        logger('');
    }
}
