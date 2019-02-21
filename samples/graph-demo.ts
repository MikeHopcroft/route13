import { Graph } from '../src/estimators';

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

    graph.print(0, console.log);

    for (let i = 0; i < vertexCount; ++i) {
        for (let j = 0; j < vertexCount; ++j) {
            const path = graph.path(i,j);
            console.log(`${i} => ${j}: ${path.length ? path : "unrachable"}`);
        }
    }
}

go();
