import React from 'react';

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

function Bone({ className = '', style }: SkeletonProps) {
    return (
        <div
            className={`rounded-2xl animate-pulse ${className}`}
            style={{ background: 'var(--border-color)', ...style }}
            aria-hidden="true"
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="p-6 rounded-[2rem]" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-6">
                <Bone className="w-12 h-12 rounded-2xl" />
                <Bone className="w-16 h-5 rounded-full" />
            </div>
            <Bone className="h-3 w-24 mb-2" />
            <Bone className="h-8 w-32" />
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Bone className="h-3 w-2/5" />
                <Bone className="h-3 w-1/4" />
            </div>
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="w-8 h-8 rounded-xl" />
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="animate-slide-up space-y-8">
            {/* Header bone */}
            <div className="p-8 rounded-[3rem]" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-6">
                    <Bone className="w-20 h-20 rounded-[2rem]" />
                    <div className="flex-1 space-y-3">
                        <Bone className="h-4 w-40" />
                        <Bone className="h-8 w-72" />
                    </div>
                </div>
            </div>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            {/* Chart */}
            <div className="p-8 rounded-[2.5rem]" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <Bone className="h-5 w-48 mb-8" />
                <Bone className="h-64 w-full rounded-2xl" />
            </div>
        </div>
    );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
    return (
        <div className="rounded-[2rem] overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            {/* Header */}
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg-alt)' }}>
                <Bone className="h-4 w-32" />
                <Bone className="h-8 w-24 rounded-full" />
            </div>
            {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
    );
}
