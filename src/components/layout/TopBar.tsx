import type { ReactNode } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface TopBarProps {
    title: ReactNode;
    showBack?: boolean;
    showLogo?: boolean;
    rightAction?: ReactNode;
    variant?: 'light' | 'dark';
}

export function TopBar({ title, showBack, showLogo, rightAction, variant = 'light' }: TopBarProps) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const isDark = variant === 'dark';

    return (
        <header className={cn(
            'fixed top-0 left-0 right-0 z-50 pt-safe',
            isDark
                ? 'bg-[#92400e]'
                : 'bg-white border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)]'
        )}>
            <div className="flex items-center justify-between h-16 px-4 max-w-md mx-auto">
                <div className="flex-1 flex justify-start">
                    {showBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className={cn('p-2 rounded-full transition-colors -ml-2',
                                isDark
                                    ? 'text-amber-200 hover:text-white hover:bg-white/15'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            )}
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                </div>
                <div className="flex-[2] flex justify-center items-center gap-2">
                    {showLogo ? (
                        <img
                            src="/logo.png"
                            alt="Vinay's Kitchen"
                            className="h-14 w-auto object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    ) : (
                        <span className={cn('text-base font-bold truncate', isDark ? 'text-white' : 'text-slate-900')}>
                            {title}
                        </span>
                    )}
                </div>
                <div className="flex-1 flex justify-end items-center gap-1">
                    {rightAction}
                    {rightAction && <div className={cn('w-px h-5 mx-2 shrink-0', isDark ? 'bg-white/20' : 'bg-slate-200')} />}
                    <button
                        onClick={logout}
                        className={cn('p-2 rounded-full transition-colors',
                            isDark
                                ? 'text-amber-200 hover:text-white hover:bg-white/15'
                                : 'text-slate-400 hover:text-danger-600 hover:bg-danger-50'
                        )}
                        title="Logout"
                    >
                        <LogOut size={20} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </header>
    );
}
