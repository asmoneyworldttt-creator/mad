import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: (string | SelectOption)[];
    placeholder?: string;
    className?: string;
}

export function CustomSelect({ value, onChange, options, placeholder = 'Select option...', className = '' }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const formattedOptions: SelectOption[] = options.map(opt => 
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const selectedOption = formattedOptions.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all outline-none text-sm font-bold"
                style={{ 
                    background: 'var(--bg-page)', 
                    borderColor: 'var(--border-color)', 
                    color: 'var(--text-main)',
                    boxShadow: isOpen ? '0 0 0 2px var(--primary-soft)' : 'none'
                }}
            >
                <span className={!selectedOption ? 'text-slate-400 opacity-50' : ''}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
            </button>

            {isOpen && (
                <div 
                    className="absolute z-50 w-full mt-2 rounded-[1.5rem] border shadow-2xl overflow-hidden py-2 animate-slide-up"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', backdropFilter: 'blur(10px)' }}
                >
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {formattedOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-primary/10 text-left"
                                style={{ color: opt.value === value ? 'var(--primary)' : 'var(--text-main)' }}
                            >
                                <span>{opt.label}</span>
                                {opt.value === value && <Check size={14} className="text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface CustomSliderProps {
    min: number;
    max: number;
    value: number;
    onChange: (val: number) => void;
    step?: number;
    className?: string;
}

export function CustomSlider({ min, max, value, onChange, step = 1, className = '' }: CustomSliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={`relative w-full flex items-center h-6 ${className}`}>
            <div className="absolute w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-bg-alt)' }}>
                <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%`, boxShadow: '0 0 10px var(--primary-glow)' }}
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Custom Thumb */}
            <div 
                className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none transition-all duration-300"
                style={{ 
                    left: `calc(${percentage}% - 10px)`, 
                    background: 'var(--primary)',
                    boxShadow: '0 0 15px var(--primary-glow)'
                }}
            />
        </div>
    );
}
