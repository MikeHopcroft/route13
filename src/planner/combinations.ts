
export function* combinations(select: number, from: number) {
    yield* generateCombinations(select, 0, from, []);
}

function* generateCombinations(select: number, start: number, end: number, selection: number[]): IterableIterator<number[]> {
    if (select == 0) {
        yield [...selection];
    }
    else {
        const remaining = select - 1;
        for (let i = start; i < end - remaining; ++i) {
            selection.push(i);
            yield* generateCombinations(remaining, i + 1, end, selection);
            selection.pop();
        }
    }
}

function go() {
    let counter = 0;
    for (const i of combinations(2,8)) {
        ++counter;
        console.log(`${counter}: ${i}`);
    }
}

go();
