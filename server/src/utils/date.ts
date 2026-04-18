const IST_TZ = 'Asia/Kolkata';

export function getISTDate(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: IST_TZ }));
}

export function getISTDateString(date?: Date): string {
    const d = date || new Date();
    return d.toLocaleDateString('en-CA', { timeZone: IST_TZ }); // en-CA → YYYY-MM-DD
}

export function getYesterdayISTDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA', { timeZone: IST_TZ });
}
