/**
 * Returns the current date shifted to Indian Standard Time (IST, UTC+5:30)
 */
export function getISTDate(): Date {
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + istOffset);
}

/**
 * Returns the IST date string in YYYY-MM-DD format
 */
export function getISTDateString(date?: Date): string {
    const d = date || getISTDate();
    // If we passed a Date object that isn't already offset, we handle it
    // But usually we just call getISTDate() then this
    return d.toISOString().split('T')[0];
}

/**
 * Returns Yesterday's date string in IST
 */
export function getYesterdayISTDateString(): string {
    const d = getISTDate();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}
