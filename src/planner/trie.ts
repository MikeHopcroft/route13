export interface TrieNode {
    key: number;
    children: Trie;
}

export type Trie = Array<TrieNode>;

export function buildTrie(head: number[], tail: number[]): Trie {
    const children: Trie = [];

    for (const [index, key] of tail.entries()) {
        if (key % 2 == 0 || head.includes(key - 1)) {
            const newHead = [...head, key];
            const newTail = tail.filter(x => x !== key);
            children.push({
                key,
                children: buildTrie(newHead, newTail)
            });
        }
    }
    return children;
}

export function walkTrie(trie: Trie, actions: (string|null)[], head: string[]) {
    let leafNode = true;

    for (const branch of trie) {
        const action = actions[branch.key];
        if (action) {
            leafNode = false;
            const newHead = [...head, action];
            walkTrie(branch.children, actions, newHead);
        }
    }

    if (leafNode) {
        console.log(head.join(''));
    }
}
