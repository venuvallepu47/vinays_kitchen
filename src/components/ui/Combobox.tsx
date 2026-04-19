import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Option {
    id: string | number;
    name: string;
    [key: string]: any;
}

interface Props {
    options: Option[];
    value: string | number;
    onChange: (value: string | number, isManual: boolean) => void;
    placeholder?: string;
    className?: string;
}

/**
 * A searchable combobox that allows selecting from a list or entering a manual name.
 * Optimized for mobile with large touch targets and clean filtering.
 */
export function Combobox({ options, value, onChange, placeholder = "Search...", className = "" }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Get current name from ID or use value if it's manual
    const selectedOption = options.find(o => String(o.id) === String(value));
    const displayName = selectedOption ? selectedOption.name : (value ? String(value) : '');

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = options.filter(o => 
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (option: Option) => {
        onChange(option.id, false);
        setIsOpen(false);
        setSearch('');
    };

    const handleManualEntry = () => {
        if (!search) return;
        onChange(search, true);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={cn("relative", className)} ref={wrapperRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer active:bg-slate-50 transition-all shadow-sm focus-within:border-primary-500 focus-within:shadow-md"
            >
                <div className="flex-1 min-w-0">
                    {displayName ? (
                        <p className="text-base font-black text-slate-900 truncate">{displayName}</p>
                    ) : (
                        <p className="text-base font-bold text-slate-400">{placeholder}</p>
                    )}
                </div>
                <ChevronDown size={18} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                placeholder={placeholder}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleManualEntry();
                                }}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="max-h-[250px] overflow-y-auto overscroll-contain py-1">
                        {filtered.length > 0 ? (
                            filtered.map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                >
                                    <span className={cn("text-sm font-bold", String(option.id) === String(value) ? "text-primary-600" : "text-slate-700")}>
                                        {option.name}
                                    </span>
                                    {String(option.id) === String(value) && <Check size={16} className="text-primary-600" />}
                                </button>
                            ))
                        ) : search && (
                            <button
                                type="button"
                                onClick={handleManualEntry}
                                className="w-full px-5 py-4 flex flex-col items-center gap-1 hover:bg-primary-50 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-primary-600 font-black text-sm">
                                    <Plus size={16} strokeWidth={3} />
                                    <span>Add "{search}"</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Create as new material</p>
                            </button>
                        )}
                        
                        {!search && filtered.length === 0 && (
                            <div className="py-8 text-center px-4">
                                <p className="text-xs font-bold text-slate-400 italic">No materials available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
