import React, { useState, useEffect } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateInput } from '../components/ui/DateInput';
import { useToast } from '../contexts/ToastContext';
import { today } from '../utils/format';
import { cn } from '../utils/cn';
import api from '../utils/api';

const STATUS_OPTIONS = ['Present', 'Absent', 'Half-day'] as const;
type Status = typeof STATUS_OPTIONS[number];

const STATUS_STYLE: Record<Status, string> = {
    Present:  'bg-success-100 text-success-700 border-success-300',
    Absent:   'bg-danger-100 text-danger-700 border-danger-300',
    'Half-day': 'bg-warning-100 text-warning-700 border-warning-300',
};

export function Attendance() {
    const { toast } = useToast();
    const [date, setDate] = useState(today());
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);

    const fetchAttendance = async (d: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/attendance?date=${d}`);
            setWorkers(res.data);
        } catch { toast('Failed to load attendance', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAttendance(date); }, [date]);

    const changeDate = (delta: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + delta);
        setDate(d.toISOString().split('T')[0]);
    };

    const markAttendance = async (worker_id: number, status: Status) => {
        setSaving(worker_id);
        try {
            await api.post('/attendance', { worker_id, date, status });
            setWorkers(prev => prev.map(w => w.id === worker_id ? { ...w, attendance: { status } } : w));
            toast(`Marked ${status}`);
        } catch { toast('Failed to save', 'error'); }
        finally { setSaving(null); }
    };

    return (
        <div className="pb-24">
            {/* Date Selector */}
            <div className="px-4 pt-4 pb-3">
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-3.5 flex items-center gap-3">
                    <button onClick={() => changeDate(-1)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 active:bg-slate-100 active:text-primary-600 transition-all active:scale-90 border border-slate-100">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <DateInput 
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            hideLabel
                        />
                    </div>
                    <button onClick={() => changeDate(1)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 active:bg-slate-100 active:text-primary-600 transition-all active:scale-90 border border-slate-100">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Summary */}
            {!loading && workers.length > 0 && (
                <div className="px-4 pb-3">
                    <div className="grid grid-cols-3 gap-2">
                        {STATUS_OPTIONS.map(s => {
                            const count = workers.filter(w => w.attendance?.status === s).length;
                            return (
                                <div key={s} className={cn('rounded-xl p-3 text-center border', STATUS_STYLE[s])}>
                                    <p className="text-lg font-black">{count}</p>
                                    <p className="text-[10px] font-bold uppercase">{s}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Workers List */}
            {loading ? (
                <div className="px-4 flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
                </div>
            ) : workers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <CalendarCheck size={24} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No active workers</p>
                    <p className="text-xs text-slate-400">Add workers from the Workers tab first</p>
                </div>
            ) : (
                <div className="px-4 space-y-2">
                    {workers.map(worker => {
                        const currentStatus = worker.attendance?.status as Status | undefined;
                        const isSavingThis = saving === worker.id;
                        return (
                            <div key={worker.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-black text-blue-700">{worker.name.charAt(0)}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 flex-1">{worker.name}</p>
                                    <p className="text-xs text-slate-400">₹{worker.salary_per_day}/day</p>
                                    {isSavingThis && <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />}
                                </div>
                                <div className="flex gap-2">
                                    {STATUS_OPTIONS.map(status => (
                                        <button
                                            key={status}
                                            disabled={isSavingThis}
                                            onClick={() => markAttendance(worker.id, status)}
                                            className={cn(
                                                'flex-1 py-2 text-xs font-bold rounded-xl border transition-all active:scale-[0.97]',
                                                currentStatus === status
                                                    ? STATUS_STYLE[status] + ' shadow-sm'
                                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
