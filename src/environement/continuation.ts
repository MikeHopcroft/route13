export type NextStep = (continuation: IterableIterator<NextStep>) => void;
export type Continuation = IterableIterator<NextStep>;

export function resume(continuation: Continuation) {
    const { done, value } = continuation.next();
    const schedule = value;
    if (!done) {
        schedule(continuation);
    }
}
