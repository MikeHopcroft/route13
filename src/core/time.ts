// Mapping from common time units to the milliseconds used by the Date class.
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const MIN_DATE = -8640000000000000;
export const MAX_DATE = 8640000000000000;

export function time(hour: number, minute: number = 0, seconds: number = 0) {
    return hour * HOUR + minute * MINUTE + seconds * SECOND;
}
