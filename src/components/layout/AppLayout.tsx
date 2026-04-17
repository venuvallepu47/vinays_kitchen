import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { cn } from '../../utils/cn';

const PAGE_TITLES: Record<string, string> = {
    '/':           "Vinay's Kitchen",
    '/sales':      'Daily Sales',
    '/workers':    'Workers',
    '/vendors':    'Vendors',
    '/materials':  'Materials & Stock',
    '/attendance': 'Mark Attendance',
    '/salaries':   'Salary Payments',
    '/expenses':   'Expenses & Rent',
    '/reports':    'P&L Reports',
    '/settings':   'Settings',
};

export function AppLayout() {
    const location = useLocation();
    const title = PAGE_TITLES[location.pathname] || "Vinay's Kitchen";
    const isDashboard = location.pathname === '/';

    return (
        <div className="h-dvh bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title={title} showLogo={isDashboard} variant="light" />
            <div className="flex-1 pt-16 pb-16 overflow-hidden">
                <div className={cn('h-full overflow-y-auto overscroll-y-contain', !isDashboard && 'p-4')}>
                    <Outlet />
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
