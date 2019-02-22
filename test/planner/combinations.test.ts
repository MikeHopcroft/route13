import { assert } from 'chai';
import 'mocha';

import { combinations } from '../../src';


describe('planner', () => {
    describe('combinations', () => {
        it('0 of 8', () => {
            const expected: number[][] = [];

            const observed = [...combinations(0, 8)];
            assert.deepEqual(observed, expected);
        });

        it('1 of 8', () => {
            const expected = [
                [0],
                [1],
                [2],
                [3],
                [4],
                [5],
                [6],
                [7]
            ];

            const observed = [...combinations(1, 8)];
            assert.deepEqual(observed, expected);
        });

        it('2 of 8', () => {
            const expected = [
                [0,1],
                [0,2],
                [0,3],
                [0,4],
                [0,5],
                [0,6],
                [0,7],
                [1,2],
                [1,3],
                [1,4],
                [1,5],
                [1,6],
                [1,7],
                [2,3],
                [2,4],
                [2,5],
                [2,6],
                [2,7],
                [3,4],
                [3,5],
                [3,6],
                [3,7],
                [4,5],
                [4,6],
                [4,7],
                [5,6],
                [5,7],
                [6,7]
            ];

            const observed = [...combinations(2, 8)];
            assert.deepEqual(observed, expected);
        });

        it('2 of 0', () => {
            const expected: number[][] = [];

            const observed = [...combinations(2, 0)];
            assert.deepEqual(observed, expected);
        });

        it('2 of 1', () => {
            const expected: number[][] = [];

            const observed = [...combinations(2, 1)];
            assert.deepEqual(observed, expected);
        });

        it('2 of 2', () => {
            const expected: number[][] = [[0, 1]];

            const observed = [...combinations(2, 2)];
            assert.deepEqual(observed, expected);
        });

        it('2 of 3', () => {
            const expected: number[][] = [[0, 1], [0, 2], [1,2]];

            const observed = [...combinations(2, 3)];
            assert.deepEqual(observed, expected);
        });
    });
});
