import { assert } from 'chai';
import 'mocha';

import { Graph, Vertex } from '../../src/estimators';

const vertexCount = 4;

const edges = [
    { from: 0, to: 2, weight: -2 },
    { from: 1, to: 0, weight: 4 },
    { from: 1, to: 2, weight: 3 },
    { from: 2, to: 3, weight: 2 },
    { from: 3, to: 1, weight: -1 }
];

const graph = new Graph(vertexCount, edges);

describe('estimators', () => {
    describe('graph', () => {
        it('distance matrix', () => {

            const expectedDistance: number[][] = [
                [0, -1, -2, 0],
                [4, 0, 2, 4],
                [5, 1, 0, 2],
                [3, -1, 1, 0]
            ];
            assert.deepEqual(graph.distance, expectedDistance);
        });

        it('next matrix', () => {
            const expectedNext: (Vertex|null)[][] = [
                [null, 2, 2, 2],
                [0, null, 0, 0],
                [3, 3, null, 3],
                [1, 1, 1, null]
            ];
            assert.deepEqual(graph.next, expectedNext);
        });

        it('paths', () => {
            const routes = [
                {start: 0, end: 0, path: []},
                {start: 0, end: 1, path: [2,3,1]},
                {start: 0, end: 2, path: [2]},
                {start: 0, end: 3, path: [2,3]},
                {start: 1, end: 0, path: [0]},
                {start: 1, end: 1, path: []},
                {start: 1, end: 2, path: [0,2]},
                {start: 1, end: 3, path: [0,2,3]},
                {start: 2, end: 0, path: [3,1,0]},
                {start: 2, end: 1, path: [3,1]},
                {start: 2, end: 2, path: []},
                {start: 2, end: 3, path: [3]},
                {start: 3, end: 0, path: [1,0]},
                {start: 3, end: 1, path: [1]},
                {start: 3, end: 2, path: [1,0,2]},
                {start: 3, end: 3, path: []},                
            ];

            for (const route of routes) {
                const path = graph.path(route.start, route.end);
                assert.deepEqual(path, route.path);
            }
        });
    });
});
