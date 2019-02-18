/*
let dist be a 
  
    
    {\displaystyle |V|\times |V|}
  
{\displaystyle |V|\times |V|} array of minimum distances initialized to 
  
    
    {\displaystyle \infty }
  
\infty  (infinity)
let next be a 
  
    
    {\displaystyle |V|\times |V|}
  
{\displaystyle |V|\times |V|} array of vertex indices initialized to null

procedure FloydWarshallWithPathReconstruction ()
   for each edge (u,v)
      dist[u][v] ← w(u,v)  // the weight of the edge (u,v)
      next[u][v] ← v
   for k from 1 to |V| // standard Floyd-Warshall implementation
      for i from 1 to |V|
         for j from 1 to |V|
            if dist[i][j] > dist[i][k] + dist[k][j] then
               dist[i][j] ← dist[i][k] + dist[k][j]
               next[i][j] ← next[i][k]

procedure Path(u, v)
   if next[u][v] = null then
       return []
   path = [u]
   while u ≠ v
       u ← next[u][v]
       path.append(u)
   return path
*/

export type Vertex = number;

export interface Edge {
    from: Vertex;
    to: Vertex;
    weight: number;
}

export class Graph {
    vertexCount: number;
    distance: number[][];
    next: (Vertex|null)[][];

    constructor(vertexCount: number, edges: Edge[]) {
        this.vertexCount = vertexCount;

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
            distance[i][i] = 0;     // Missing line from Wikipedia.
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
            this.print(k);
        }
    }

    cost(from: Vertex, to: Vertex): number {
        return this.distance[from][to];
    }

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

    print(iteration: number) {
        console.log(`=== Iteration ${iteration} ===`);
        console.log('Distances');
        for (let i = 0; i < this.vertexCount; ++i) {
            console.log(`${i}: ${this.distance[i].join(' ')}`);
        }
    
        console.log();
    
        console.log('Next');
        for (let i = 0; i < this.vertexCount; ++i) {
            console.log(`${i}: ${this.next[i].join(' ')}`);
        }    

        console.log();
    }
}

function go() {
    const vertexCount = 4;

    const edges = [
        {
            from: 0,
            to: 2,
            weight: -2
        },

        {
            from: 1,
            to: 0,
            weight: 4
        },
        {
            from: 1,
            to: 2,
            weight: 3
        },

        {
            from: 2,
            to: 3,
            weight: 2
        },

        {
            from: 3,
            to: 1,
            weight: -1
        }
    ];

    const graph = new Graph(vertexCount, edges);

    graph.print(0);

    for (let i = 0; i < vertexCount; ++i) {
        for (let j = 0; j < vertexCount; ++j) {
            console.log(`${i} => ${j}: ${graph.path(i,j)}`);
        }
    }


    // console.log('Distances');
    // for (let i = 0; i < vertexCount; ++i) {
    //     console.log(`${i}: ${graph.distance[i].join(' ')}`);
    // }

    // console.log();

    // console.log('Next');
    // for (let i = 0; i < vertexCount; ++i) {
    //     console.log(`${i}: ${graph.next[i].join(' ')}`);
    // }
}

go();


