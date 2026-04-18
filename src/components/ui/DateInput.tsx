import React, { useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

// Extend Window interface for flatpickr global
declare global {
    interface Window {
        flatpickr: any;
    }
}

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    hideLabel?: boolean;
    containerClassName?: string;
}

/**
 * Industry-Grade Date Input powered by Flatpickr.
 * This component provides a premium, theme-customized calendar interface
 * that overrides native browser behaviors for 100% design consistency.
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
    ({ label, error, hideLabel, className, containerClassName, value, onChange, placeholder, ...props }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const fpInstance = useRef<any>(null);

        useEffect(() => {
            if (!inputRef.current || !window.flatpickr) return;

            // Initialize Flatpickr
            fpInstance.current = window.flatpickr(inputRef.current, {
                disableMobile: true,
                dateFormat: "Y-m-d",
                animate: true,
                defaultDate: value || undefined,
                onChange: (_selectedDates: Date[], dateStr: string) => {
                    // Trigger the native-like onChange event for React
                    if (onChange) {
                        const event = {
                            target: { value: dateStr, name: props.name || '' }
                        } as React.ChangeEvent<HTMLInputElement>;
                        onChange(event);
                    }
                },
            });

            return () => {
                if (fpInstance.current) {
                    fpInstance.current.destroy();
                }
            };
        }, []);

        // Sync external value changes to Flatpickr
        useEffect(() => {
            if (fpInstance.current && value !== undefined) {
                fpInstance.current.setDate(value, false);
            }
        }, [value]);

        return (
            <div className={cn("flex flex-col gap-1.5", containerClassName)}>
                {label && !hideLabel && (
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <input
                        {...props}
                        ref={(node) => {
                            // Support both the forwarded ref and local inputRef
                            (inputRef as any).current = node;
                            if (typeof ref === 'function') ref(node);
                            else if (ref) (ref as any).current = node;
                        }}
                        type="text" // Flatpickr works best on text inputs
                        placeholder={placeholder || "Select Date"}
                        readOnly={props.readOnly}
                        className={cn(
                            "w-full h-12 pl-4 pr-10 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 shadow-sm transition-all cursor-pointer",
                            "focus:shadow-md outline-none focus:border-primary-500",
                            "group-hover:border-slate-300",
                            error && "border-danger-200 bg-danger-50/10 focus:border-danger-500",
                            className
                        )}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-primary-600 group-focus-within:text-primary-600 transition-colors">
                        <Calendar size={18} />
                    </div>
                </div>
                {error && <p className="text-[10px] font-bold text-danger-500 px-1">{error}</p>}
            </div>
        );
    }
);

DateInput.displayName = 'DateInput';
