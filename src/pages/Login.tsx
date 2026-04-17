import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
    const [email, setEmail] = useState('admin@vinayskitchen.com');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 400));
        if (email === 'admin@vinayskitchen.com' && password === 'admin123') {
            login({ email, name: "Vinay Admin" });
            navigate('/');
        } else {
            setError('Invalid email or password. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-amber-900 via-orange-900 to-stone-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img src="/logo.png" alt="Vinay's Kitchen" className="h-20 w-20 object-cover rounded-2xl shadow-lg border-2 border-amber-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Vinay's Kitchen</h1>
                        <p className="text-slate-500 text-sm">Management System</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="admin@vinayskitchen.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 group"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <LogIn className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        Default: <strong>admin@vinayskitchen.com</strong> / <strong>admin123</strong>
                    </p>
                </div>
                <p className="mt-6 text-center text-xs text-amber-300">© {new Date().getFullYear()} Vinay's Kitchen Management</p>
            </div>
        </div>
    );
}
