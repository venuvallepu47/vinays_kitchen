import { formatCurrency, formatCurrencyFull } from '../../utils/format';

interface Props {
    amount: number | string;
    /** className for the compact number line */
    className?: string;
    /** className for the exact number line — defaults to inheriting color at reduced opacity */
    exactClassName?: string;
}

/**
 * Shows a compact Indian-format amount (₹1.23Cr / ₹12.5L / ₹1.2K / ₹999)
 * with the full exact amount on a smaller line below — but only when the
 * number is large enough to have been compacted (>= ₹1,000).
 *
 * Use this for every summary card, banner, and hero stat.
 * Use plain formatCurrency() for list-row amounts where space is tight.
 */
export function AmountDisplay({ amount, className = '', exactClassName }: Props) {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const safe = isNaN(num) ? 0 : num;
    const compact = formatCurrency(safe);
    const showExact = Math.abs(safe) >= 1_000;

    return (
        <>
            <span className={className}>{compact}</span>
            {showExact && (
                <span className={exactClassName ?? 'block text-[10px] font-semibold opacity-40 mt-0.5 tabular-nums'}>
                    {formatCurrencyFull(safe)}
                </span>
            )}
        </>
    );
}
