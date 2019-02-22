import { assert } from 'chai';
import 'mocha';

import { buildTrie, Trie } from '../../src';

// Generator enumerates a string form of each path in the trie.
function* walkTrie(trie: Trie, actions: (number | null)[], head: number[]): IterableIterator<string> {
    let leafNode = true;

    for (const branch of trie) {
        const action = actions[branch.key];
        if (action != null) {
            leafNode = false;
            const newHead = [...head, action];
            yield* walkTrie(branch.children, actions, newHead);
        }
    }

    if (leafNode) {
        yield head.join('');
    }
}

// Generator for permutations of input array that correspond to legal plans.
function* filteredPermutations(a: number[]): IterableIterator<string> {
    for (const permutation of permutations(a)) {
        if (isLegal(permutation)) {
            yield permutation.join('');
        }
    }
}

// Generator for permutations of input array.
function* permutations(a: number[], n = a.length): IterableIterator<number[]> {
    if (n <= 1) {
        yield a.slice();
    }
    else {
        for (let i = 0; i < n; i++) {
            yield* permutations(a, n - 1);
            const j = n % 2 ? 0 : i;
            [a[n - 1], a[j]] = [a[j], a[n - 1]];
        }
    }
}

function isLegal(a: number[]) {
    const seen = a.map((x) => false);
    for (const x of a) {
        seen[x] = true;
        if (x % 2 === 1 && !seen[x - 1]) {
            // We're seeing an item out of order.
            return false;
        }
    }
    return true;
}

describe('planner', () => {
    describe('trie', () => {
        it('[0, 1, 2, 3, 4, 5]', () => {
            const maxJobs = 3;
            const actions = [...Array(maxJobs * 2).keys()];

            // Build a trie, gather all of its entries, and sort.
            const trie = buildTrie([], actions);
            const observed = [...walkTrie(trie, actions, [])].sort();

            // Generate the expected filtered permutations, using another algorithm.
            const expected = [...filteredPermutations(actions)].sort();

            assert.deepEqual(observed, expected);
        });
    });
});
