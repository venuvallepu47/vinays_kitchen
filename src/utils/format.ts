export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getISTDate(): Date {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    return new Date(now.getTime() + istOffset);
}

export function today(): string {
    return getISTDate().toISOString().split('T')[0];
}

export function formatDateInput(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (typeof date !== 'string') {
        const istDate = getISTDate(); // Assuming the input Date was meant to be now
        return istDate.toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
}
