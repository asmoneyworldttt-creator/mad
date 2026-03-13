import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, size = 'md' }: EmptyStateProps) {
    const sizes = {
        sm: { icon: 32, p: 'p-8', title: 'text-base', desc: 'text-xs' },
        md: { icon: 48, p: 'p-12', title: 'text-xl', desc: 'text-sm' },
        lg: { icon: 64, p: 'p-20', title: 'text-2xl', desc: 'text-base' },
    }[size];

    return (
        <div className={`flex flex-col items-center justify-center text-center ${sizes.p}`} aria-live="polite">
            {/* Illustrated icon container */}
            <div className="relative mb-6">
                <div className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center"
                    style={{ background: 'var(--primary-soft)', border: '1px solid var(--border-color)' }}>
                    <Icon size={sizes.icon} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                </div>
                {/* Decorative dots */}
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full" style={{ background: 'var(--primary)', opacity: 0.15 }} />
                <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full" style={{ background: 'var(--success)', opacity: 0.1 }} />
            </div>

            <h3 className={`font-black tracking-tight mb-2 ${sizes.title}`} style={{ color: 'var(--text-dark)' }}>
                {title}
            </h3>
            <p className={`max-w-xs leading-relaxed mb-6 ${sizes.desc}`} style={{ color: 'var(--text-muted)' }}>
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary-glow)' }}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
