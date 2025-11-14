import React from 'react';

interface SkeletonLoaderProps {
    count?: number;
    className?: string;
}

export function PhotoGridSkeleton({ count = 12 }: SkeletonLoaderProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="group relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"
                    style={{
                        gridRowEnd: 'span 20', // Default height for skeleton
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
                </div>
            ))}
        </>
    );
}

export function AlbumCardSkeleton({ count = 6 }: SkeletonLoaderProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#202124] overflow-hidden animate-pulse"
                >
                    <div className="aspect-square bg-gray-200 dark:bg-gray-800" />
                    <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </>
    );
}

export function NotificationSkeleton({ count = 5 }: SkeletonLoaderProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#202124] p-4 animate-pulse"
                >
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

export function TextSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={`h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ${
                        i === lines - 1 ? 'w-3/4' : 'w-full'
                    }`}
                />
            ))}
        </div>
    );
}

