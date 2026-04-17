import { Settings as SettingsIcon, User, Building, Info } from 'lucide-react';

export function Settings() {
    return (
        <div className="pb-24 space-y-4">
            {/* Shop Profile */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Building size={18} className="text-primary-700" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Shop Details</p>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Shop Name</label>
                        <input defaultValue="Vinay's Kitchen" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Owner Name</label>
                        <input defaultValue="Vinay" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
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
                    <div className="flex justify-between items-center py-2">
                        <span className="text-slate-500 font-medium">Tech Stack</span>
                        <span className="font-bold text-slate-700">React + Node.js + PostgreSQL</span>
                    </div>
                </div>
            </div>

            {/* Logo */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center gap-4">
                <img src="/logo.png" alt="Vinay's Kitchen" className="w-20 h-20 rounded-2xl object-cover shadow-md" />
                <div className="text-center">
                    <p className="text-base font-black text-slate-900">Vinay's Kitchen</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tiffin Shop Management System</p>
                </div>
            </div>
        </div>
    );
}
