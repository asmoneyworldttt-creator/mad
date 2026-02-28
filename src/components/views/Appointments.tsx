

export function Appointments() {
    return (
        <div className="bg-background-soft font-sans text-slate-900 min-h-screen pb-32 animated-gradient-bg relative">
            <div className="max-w-md mx-auto relative min-h-screen overflow-hidden">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-medical-teal/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/4 -right-20 w-72 h-72 bg-medical-blue/10 rounded-full blur-3xl"></div>

                <header className="pt-10 px-6 pb-6 sticky top-0 z-40 bg-white/40 backdrop-blur-xl border-b border-white/20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-medical-blue/60 mb-1">Medical Protocol</p>
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                                Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-teal to-medical-blue">Schedule</span>
                            </h1>
                        </div>
                        <button className="w-12 h-12 rounded-full glass-morphism flex items-center justify-center text-medical-blue shadow-lg hover:scale-105 transition-transform duration-300">
                            <span className="material-symbols-outlined font-bold">add</span>
                        </button>
                    </div>

                    <div className="flex p-1.5 glass-morphism rounded-2xl mb-8">
                        <button className="flex-1 py-2.5 rounded-xl bg-white shadow-sm text-xs font-bold text-slate-900 tracking-wide uppercase">Active</button>
                        <button className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 tracking-wide uppercase">History</button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
                        <div className="flex flex-col items-center justify-center min-w-[64px] h-24 rounded-2xl bg-gradient-to-br from-medical-teal to-medical-blue text-white date-active-glow">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Mon</span>
                            <span className="text-2xl font-extrabold">12</span>
                            <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 animate-pulse"></div>
                        </div>
                        <div className="flex flex-col items-center justify-center min-w-[64px] h-24 rounded-2xl glass-morphism text-slate-400 border-white/60">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Tue</span>
                            <span className="text-2xl font-bold">13</span>
                        </div>
                        <div className="flex flex-col items-center justify-center min-w-[64px] h-24 rounded-2xl glass-morphism text-slate-400 border-white/60">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Wed</span>
                            <span className="text-2xl font-bold">14</span>
                        </div>
                        <div className="flex flex-col items-center justify-center min-w-[64px] h-24 rounded-2xl glass-morphism text-slate-400 border-white/60">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Thu</span>
                            <span className="text-2xl font-bold">15</span>
                        </div>
                        <div className="flex flex-col items-center justify-center min-w-[64px] h-24 rounded-2xl glass-morphism text-slate-400 border-white/60">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Fri</span>
                            <span className="text-2xl font-bold">16</span>
                        </div>
                    </div>
                </header>

                <main className="px-6 space-y-6 pt-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Upcoming Sessions</h2>
                        <span className="text-[11px] font-bold bg-medical-blue/10 text-medical-blue px-3 py-1 rounded-full border border-medical-blue/20">4 Appointments</span>
                    </div>

                    <div className="glass-morphism card-gradient-1 rounded-3xl p-5 flex flex-col gap-5 border-white/50 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-200 overflow-hidden ring-4 ring-white/80 shadow-inner">
                                    <img alt="Sarah Jenkins" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZH8D4DCqyxVSbWe9l77huLvcXKa1aVQ76TYOKcHr8CtKah2xLyG6tre55lo9a3jf5G9iWGEHUPwAZNfNK3afb08YjdrawfFLLqSBQtgv-QK9CJ0ZgHHyN1sDerSv03yVLGwApiMjyH-8tsjADY56hfwGpZlh7X3BXdc0MtWkyaXyuftzrbphDi2eXeLKwXOMvd5GkotEO3ffelcp7W3LVVQOEzMT3KGEijR2yAF3GLCQ3YTiiZTcBygzvNvzUF2yISt4QNn7znSx7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Sarah Jenkins</h3>
                                    <p className="text-xs font-semibold text-medical-teal flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">cardiology</span> Cardiology Consultation
                                    </p>
                                </div>
                            </div>
                            <span className="bg-amber-100/50 backdrop-blur-md text-amber-700 text-[10px] font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider border border-amber-200/50">Pending</span>
                        </div>
                        <div className="flex items-center gap-6 py-4 border-y border-white/30">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-medical-blue/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-md text-medical-blue">schedule</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">09:30 AM</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-medical-teal/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-md text-medical-teal">apartment</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">Room 402</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-medical-teal to-medical-blue text-white text-xs font-extrabold shadow-lg shadow-medical-blue/20 hover:opacity-90 transition-all uppercase tracking-widest">Accept Slot</button>
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl glass-morphism text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-all">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="glass-morphism rounded-3xl p-5 flex flex-col gap-5 border-white/50 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-200 overflow-hidden ring-4 ring-white/80 shadow-inner">
                                    <img alt="Marcus Wright" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBefO1nSPs19pvvakJgyaUTP9QSfE8owsUzRoU7siHB0qP9n_v-caDlyD89D88pLtu8iLZHiPHixH32rY5qkjLGujxViv7GSKTB0M1mrZZJNnrXYfpc2amncY0aP6q-BNcSVCnPxiK3y8z1DGxAyKkolTkWRR7iHMAbG3Dg0vND5CZB7RNMNew0Rjov-Pok5sQZBsKD7YlWakE5OEbN2Z-U2vNNzUR3ezJ0EEGYJmGllHd52kj0SOdx6z10rfZ61wxr6O6LV78d1n6B" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Marcus Wright</h3>
                                    <p className="text-xs font-semibold text-medical-blue flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">biotech</span> MRI Analysis Result
                                    </p>
                                </div>
                            </div>
                            <span className="bg-emerald-100/50 backdrop-blur-md text-emerald-700 text-[10px] font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider border border-emerald-200/50">Confirmed</span>
                        </div>
                        <div className="flex items-center gap-6 py-4 border-y border-white/30">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-medical-blue/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-md text-medical-blue">schedule</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">11:15 AM</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-md text-indigo-500">videocam</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">Telehealth</span>
                            </div>
                        </div>
                        <button className="w-full py-3.5 rounded-2xl glass-morphism text-slate-600 text-xs font-extrabold border-slate-200/50 hover:bg-slate-50 transition-all uppercase tracking-widest">Patient History</button>
                    </div>

                    <div className="glass-morphism rounded-3xl p-5 flex flex-col gap-5 border-white/50 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-200 overflow-hidden ring-4 ring-white/80 shadow-inner">
                                    <img alt="Elena Rossi" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwFFYRyJ2NcAHCvZR0wBLcDvLny2RNscLqSnpwcxP6PhY9pUVpkTiItVF2EmIMJtCb0kPliyJEx3bt5J_GP8PtngCQh44GmvZfdne5YCzYpuAe7Jpa9EklqnStadYcq8EG1KUt-NeHoN5HffVWXIAowi13SIL-u_Ni-mIY0hZnaiaGP_iYXgJnViRZcHT-bO4Vx0trluPO-XZW2tuWAj3ZYxSKEOFFP3_63Cn563uYZkWirL3-jk-MqHzMcWZ_nvagtjIuKEUC2VLF" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Elena Rossi</h3>
                                    <p className="text-xs font-semibold text-pink-500 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">dermatology</span> Dermatology Screen
                                    </p>
                                </div>
                            </div>
                            <span className="bg-primary/10 backdrop-blur-md text-primary text-[10px] font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider border border-primary/20">In Progress</span>
                        </div>
                        <div className="flex items-center gap-6 py-4 border-y border-white/30">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-medical-blue/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-md text-medical-blue">schedule</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">02:45 PM</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-medical-teal/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-md text-medical-teal">meeting_room</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">Room 105</span>
                            </div>
                        </div>
                        <button className="w-full py-3.5 rounded-2xl bg-primary/10 text-primary text-xs font-extrabold hover:bg-primary/20 transition-all uppercase tracking-widest border border-primary/20">Resume Session</button>
                    </div>
                </main>

                <div className="h-20"></div>
            </div>

            <style>{`
                .glass-morphism {
                    background: rgba(255, 255, 255, 0.65);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
                }
                .glass-nav-dock {
                    background: rgba(255, 255, 255, 0.75);
                    backdrop-filter: blur(24px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.15);
                }
                .card-gradient-1 {
                    background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
                }
                .animated-gradient-bg {
                    background: linear-gradient(-45deg, #f8fafc, #f1f5f9, #e2e8f0, #f8fafc);
                    background-size: 400% 400%;
                    animation: gradientMove 15s ease infinite;
                }
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .date-active-glow {
                    box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
                }
            `}</style>
        </div>
    );
}
