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

    // Mobile Keyboard Fix: Track visual viewport to prevent navbar lifting issues
    const [vh, setVh] = useState(window.visualViewport?.height || window.innerHeight);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        if (!window.visualViewport) return;
        const handleResize = () => {
            const currentVh = window.visualViewport!.height;
            setVh(currentVh);
            
            // If height drops significantly, keyboard is likely open
            setIsKeyboardVisible(currentVh < window.innerHeight * 0.85);

            // Ensure no ghost scrolling on keyboard dismissal
            if (currentVh >= window.innerHeight) {
                window.scrollTo(0, 0);
            }
        };
        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);
        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
        };
    }, []);

    return (
        <div 
            style={{ height: vh }}
            className="fixed inset-0 bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden"
        >
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
