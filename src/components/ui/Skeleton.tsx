import React from 'react';
import { cn } from '../../utils/cn';

export function SkeletonBlock({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={cn('animate-shimmer rounded-xl', className)} />;
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            <SkeletonBlock className="h-40 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
                <SkeletonBlock className="h-24" />
                <SkeletonBlock className="h-24" />
            </div>
            <SkeletonBlock className="h-6 w-32" />
            {[1,2,3].map(i => <SkeletonBlock key={i} className="h-16" />)}
        </div>
    );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonBlock key={i} className="h-16" />
            ))}
        </div>
    );
}
