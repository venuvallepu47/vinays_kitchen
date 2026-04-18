const IST = 'Asia/Kolkata';

export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Returns DD-MM-YYYY in IST
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: IST,
    }).replace(/\//g, '-');
}

export function today(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: IST }); // en-CA gives YYYY-MM-DD
}

export function getISTDate(): Date {
    // Returns a Date whose local time reflects IST — use only for date math
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + istOffset);
}

export function formatDateInput(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', { timeZone: IST });
}
