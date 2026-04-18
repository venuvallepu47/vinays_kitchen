import { useState, useEffect } from 'react';
import { Building, Info, Package, DollarSign, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

export function Settings() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>({ material_units: [], expense_categories: [] });
    const [loading, setLoading] = useState(true);
    
    const [newUnit, setNewUnit] = useState('');
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        api.get('/settings').then(res => {
            setSettings(res.data);
            setLoading(false);
        }).catch(() => toast('Failed to load settings', 'error'));
    }, []);

    const updateSettingsApi = async (newSettings: any) => {
        try {
            await api.put('/settings', newSettings);
            toast('Settings updated');
        } catch {
            toast('Failed to update', 'error');
        }
    };

    const addUnit = () => {
        if (!newUnit.trim()) return;
        const updated = [...(settings.material_units || []), newUnit.trim()];
        const nextSettings = { ...settings, material_units: updated };
        setSettings(nextSettings);
        setNewUnit('');
        updateSettingsApi({ material_units: updated });
    };

    const removeUnit = (u: string) => {
        const updated = (settings.material_units || []).filter((x: string) => x !== u);
        const nextSettings = { ...settings, material_units: updated };
        setSettings(nextSettings);
        updateSettingsApi({ material_units: updated });
    };

    const addCategory = () => {
        if (!newCategory.trim()) return;
        const updated = [...(settings.expense_categories || []), newCategory.trim()];
        const nextSettings = { ...settings, expense_categories: updated };
        setSettings(nextSettings);
        setNewCategory('');
        updateSettingsApi({ expense_categories: updated });
    };

    const removeCategory = (c: string) => {
        const updated = (settings.expense_categories || []).filter((x: string) => x !== c);
        const nextSettings = { ...settings, expense_categories: updated };
        setSettings(nextSettings);
        updateSettingsApi({ expense_categories: updated });
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" /></div>;

    return (
        <div className="min-h-dvh bg-slate-50 pb-24 space-y-4 px-4 pt-4">
            {/* Shop Profile */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center">
                        <Building size={20} className="text-primary-700" />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Business Identity</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 px-1">Organization Name</label>
                        <input readOnly value="Vinay's Kitchen" className="w-full h-12 px-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-base font-black text-slate-400 outline-none cursor-not-allowed" />
                    </div>
                </div>
            </div>

            {/* Config: Material Units */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Package size={20} className="text-slate-600" />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Inventory Units</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                    {(settings.material_units || []).map((u: string) => (
                        <span key={u} className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-100 shadow-sm">
                            {u}
                            <button onClick={() => removeUnit(u)} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-danger-500 transition-colors"><X size={12} /></button>
                        </span>
                    ))}
                </div>
                <div className="flex flex-col gap-3">
                    <input value={newUnit} onChange={e => setNewUnit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUnit()} placeholder="e.g. Box, Bundle" 
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500" />
                    <button onClick={addUnit} className="w-full h-12 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary-500/10 active:scale-95 transition-all">Add Unit</button>
                </div>
            </div>

            {/* Config: Expense Categories */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <DollarSign size={20} className="text-slate-600" />
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Expense Categories</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                    {(settings.expense_categories || []).map((c: string) => (
                        <span key={c} className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-100 shadow-sm">
                            {c}
                            <button onClick={() => removeCategory(c)} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-danger-500 transition-colors"><X size={12} /></button>
                        </span>
                    ))}
                </div>
                <div className="flex flex-col gap-3">
                    <input value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="e.g. Marketing, Rent" 
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500" />
                    <button onClick={addCategory} className="w-full h-12 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all">Add Category</button>
                </div>
            </div>

            {/* App Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Info size={18} className="text-slate-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">App Info</p>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Version</span>
                        <span className="font-bold text-slate-900">1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Database</span>
                        <span className="font-bold text-success-600">vinay_db (Connected)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
