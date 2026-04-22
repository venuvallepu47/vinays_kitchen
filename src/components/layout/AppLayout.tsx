import { useState, useEffect } from 'react';
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
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const handleResize = () => {
            // Keyboard is open when visual viewport is significantly shorter than layout viewport.
            // Threshold of 0.85 accounts for browser chrome changes.
            setIsKeyboardVisible(vv.height / window.innerHeight < 0.85);
        };

        vv.addEventListener('resize', handleResize);
        return () => vv.removeEventListener('resize', handleResize);
    }, []);

    return (
        // fixed inset-0: always fills the full layout viewport — never creates a gap below.
        // Do NOT add height/style overrides; that's what caused the whitespace under the navbar.
        <div className="fixed inset-0 bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title={title} showLogo={isDashboard} variant="light" />
            <main className="flex-1 min-h-0 overflow-hidden relative">
                <div className={cn('h-full overflow-y-auto overscroll-y-contain', !isDashboard && 'p-4')}>
                    <Outlet />
                </div>
            </main>
            <BottomNav hidden={isKeyboardVisible} />
        </div>
    );
}
