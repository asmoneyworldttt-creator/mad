
import React from 'react';
import { motion } from 'framer-motion';

interface ToothChartProps {
    type: 'Adult' | 'Pediatric';
    selectedTeeth: string[];
    onToggleTooth: (tooth: string) => void;
    isDark?: boolean;
}

const ADULT_TEETH = {
    UR: ['18', '17', '16', '15', '14', '13', '12', '11'],
    UL: ['21', '22', '23', '24', '25', '26', '27', '28'],
    LR: ['48', '47', '46', '45', '44', '43', '42', '41'],
    LL: ['31', '32', '33', '34', '35', '36', '37', '38'],
};

const PEDIATRIC_TEETH = {
    UR: ['55', '54', '53', '52', '51'],
    UL: ['61', '62', '63', '64', '65'],
    LR: ['85', '84', '83', '82', '81'],
    LL: ['71', '72', '73', '74', '75'],
};

export const ToothChart: React.FC<ToothChartProps> = ({ type, selectedTeeth, onToggleTooth, isDark }) => {
    const teethData = type === 'Adult' ? ADULT_TEETH : PEDIATRIC_TEETH;

    const renderQuadrant = (teeth: string[], label: string, isUpper: boolean) => (
        <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className="flex gap-1.5">
                {teeth.map((tooth) => {
                    const isSelected = selectedTeeth.includes(tooth);
                    return (
                        <motion.button
                            key={tooth}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onToggleTooth(tooth)}
                            className={`
                                w-10 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300
                                ${isSelected 
                                    ? 'bg-primary border-primary shadow-lg shadow-primary/30 scale-105 z-10' 
                                    : isDark 
                                        ? 'bg-slate-800/40 border-slate-700/50 hover:border-slate-500 text-slate-300' 
                                        : 'bg-white border-slate-200 hover:border-primary/50 text-slate-500'
                                }
                            `}
                        >
                            <span className={`text-[10px] font-black ${isSelected ? 'text-white' : ''}`}>
                                {tooth}
                            </span>
                            <div className={`w-4 h-5 mt-1 rounded-t-lg rounded-b-md ${isSelected ? 'bg-white/30' : 'bg-slate-200/50 dark:bg-slate-700/50'}`} />
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className={`p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border ${isDark ? 'bg-slate-900/30 border-slate-800/40 shadow-2xl shadow-black/20' : 'bg-slate-50/50 border-slate-100 shadow-inner'} space-y-6 md:space-y-10 overflow-hidden`}>
            {/* Upper Jaw */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
                <div className="overflow-x-auto pb-2 custom-scrollbar-teeth">
                    <div className="min-w-max flex flex-col items-center">
                        {renderQuadrant(teethData.UR, 'Upper Right', true)}
                    </div>
                </div>
                <div className="overflow-x-auto pb-2 custom-scrollbar-teeth border-t sm:border-t-0 pt-6 sm:pt-0 border-slate-200/50 dark:border-slate-800/50">
                    <div className="min-w-max flex flex-col items-center">
                        {renderQuadrant(teethData.UL, 'Upper Left', true)}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:flex items-center gap-4 px-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <div className="w-2 h-2 rounded-full bg-primary/30" />
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Lower Jaw */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
                <div className="overflow-x-auto pb-2 custom-scrollbar-teeth border-t sm:border-t-0 pt-6 sm:pt-0 border-slate-200/50 dark:border-slate-800/50">
                    <div className="min-w-max flex flex-col items-center">
                        {renderQuadrant(teethData.LR, 'Lower Right', false)}
                    </div>
                </div>
                <div className="overflow-x-auto pb-2 custom-scrollbar-teeth border-t sm:border-t-0 pt-6 sm:pt-0 border-slate-200/50 dark:border-slate-800/50">
                    <div className="min-w-max flex flex-col items-center">
                        {renderQuadrant(teethData.LL, 'Lower Left', false)}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-primary shadow-sm shadow-primary/20" />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-md border-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Available</span>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                        Total: {selectedTeeth.length}
                    </span>
                </div>
            </div>

            <style>{`
                .custom-scrollbar-teeth::-webkit-scrollbar { height: 4px; }
                .custom-scrollbar-teeth::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-teeth::-webkit-scrollbar-thumb { 
                    background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; 
                    border-radius: 10px; 
                }
                .custom-scrollbar-teeth::-webkit-scrollbar-thumb:hover {
                    background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
                }
                .custom-scrollbar-teeth { -ms-overflow-style: none; scrollbar-width: thin; }
            `}</style>
        </div>
    );
};
