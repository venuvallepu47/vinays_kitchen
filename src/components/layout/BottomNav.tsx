import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingBag, Users, Truck,
    MoreHorizontal, X, Package, CalendarCheck,
    Banknote, BarChart3, Settings, ChevronRight, Receipt,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const PRIMARY_NAV = [
    { path: '/',        icon: LayoutDashboard, label: 'Home'    },
    { path: '/sales',   icon: ShoppingBag,     label: 'Sales'   },
    { path: '/workers', icon: Users,           label: 'Workers' },
    { path: '/vendors', icon: Truck,           label: 'Vendors' },
];

const MORE_ITEMS = [
    { path: '/materials',   icon: Package,      label: 'Materials & Stock', color: 'bg-orange-50 text-orange-600'  },
    { path: '/attendance',  icon: CalendarCheck, label: 'Attendance',       color: 'bg-blue-50 text-blue-600'      },
    { path: '/salaries',    icon: Banknote,      label: 'Salary Payments',  color: 'bg-success-50 text-success-700'},
    { path: '/expenses',    icon: Receipt,       label: 'Expenses & Rent',  color: 'bg-red-50 text-red-600'        },
    { path: '/reports',     icon: BarChart3,     label: 'P&L Reports',      color: 'bg-primary-50 text-primary-700'},
    { path: '/settings',    icon: Settings,      label: 'Settings',         color: 'bg-slate-100 text-slate-600'   },
];

const MORE_PATHS = MORE_ITEMS.map(i => i.path);

export function BottomNav({ hidden }: { hidden?: boolean }) {
    const [showMore, setShowMore] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isMoreActive = MORE_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

    const handleMoreItem = (path: string) => {
        setShowMore(false);
        navigate(path);
    };

    return (
        <>
            <nav className={cn(
                "relative z-[200] shrink-0 transition-all duration-300 ease-in-out",
                hidden ? "translate-y-full opacity-0 pointer-events-none h-0" : "translate-y-0 opacity-100 h-auto"
            )}>
                <div className="bg-white/95 backdrop-blur-xl border-t border-slate-100/50 shadow-[0_-1px_10px_rgba(0,0,0,0.02),0_-4px_24px_rgba(0,0,0,0.04)]"
                    style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
                    <div className="flex items-center h-[52px] max-w-md mx-auto px-2">

                        {PRIMARY_NAV.map(({ path, icon: Icon, label }) => (
                            <NavLink
                                key={path}
                                to={path}
                                end={path === '/'}
                                onClick={() => setShowMore(false)}
                                className="flex-1 flex flex-col items-center justify-center h-full gap-0.5 group"
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={cn(
                                            'relative flex items-center justify-center w-10 h-7 rounded-2xl transition-all duration-200',
                                            isActive ? 'bg-primary-100' : 'group-hover:bg-slate-100'
                                        )}>
                                            <Icon
                                                size={21}
                                                strokeWidth={isActive ? 2.5 : 1.75}
                                                className={cn('transition-all duration-200', isActive ? 'text-primary-700 scale-105' : 'text-slate-400')}
                                            />
                                        </div>
                                        <span className={cn(
                                            'text-[10px] font-bold leading-none tracking-tight transition-colors duration-200',
                                            isActive ? 'text-primary-700' : 'text-slate-400'
                                        )}>
                                            {label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        ))}

                        <button
                            onClick={() => setShowMore(v => !v)}
                            className="flex-1 flex flex-col items-center justify-center h-full gap-0.5 group"
                        >
                            <div className={cn(
                                'flex items-center justify-center w-10 h-7 rounded-2xl transition-all duration-200',
                                isMoreActive || showMore ? 'bg-primary-100' : 'group-hover:bg-slate-100'
                            )}>
                                {showMore
                                    ? <X size={21} strokeWidth={2.5} className="text-primary-700" />
                                    : <MoreHorizontal size={21} strokeWidth={isMoreActive ? 2.5 : 1.75} className={cn('transition-all duration-200', isMoreActive ? 'text-primary-700' : 'text-slate-400')} />
                                }
                            </div>
                            <span className={cn('text-[10px] font-bold leading-none tracking-tight transition-colors duration-200', isMoreActive || showMore ? 'text-primary-700' : 'text-slate-400')}>
                                More
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            {showMore && (
                <>
                    <div className="fixed inset-0 z-[190] bg-black/30 backdrop-blur-[2px]" onClick={() => setShowMore(false)} />
                    <div className="fixed left-0 right-0 z-[195] max-w-md mx-auto" style={{ bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 52px)' }}>
                        <div className="bg-white rounded-t-3xl shadow-2xl border border-slate-100/80 overflow-hidden animate-slide-up">
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-8 h-1 bg-slate-200 rounded-full" />
                            </div>
                            <p className="px-5 pt-1 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">More Options</p>
                            <div className="divide-y divide-slate-50 pb-3">
                                {MORE_ITEMS.map(({ path, icon: Icon, label, color }) => {
                                    const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
                                    return (
                                        <button
                                            key={path}
                                            onClick={() => handleMoreItem(path)}
                                            className={cn('w-full flex items-center gap-4 px-5 py-4 text-left transition-colors active:bg-slate-50', isActive ? 'bg-primary-50/50' : '')}
                                        >
                                            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', color)}>
                                                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                                            </div>
                                            <span className={cn('flex-1 text-sm font-bold', isActive ? 'text-primary-800' : 'text-slate-800')}>{label}</span>
                                            <ChevronRight size={16} className="text-slate-300 shrink-0" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
