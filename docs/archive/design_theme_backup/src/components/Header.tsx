import { Bell, Search, UserPlus, Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useToast } from './Toast';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';


type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

interface HeaderProps {
    toggleMenu: () => void;
    userRole: UserRole;
    setUserRole: (role: UserRole) => void;
    setActiveTab: (tab: string) => void;
    setGlobalPatient: (p: any) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    onLogout?: () => void;
}

export function Header({ toggleMenu, userRole, setUserRole, setActiveTab, setGlobalPatient, theme, setTheme, onLogout }: HeaderProps) {
    const { showToast } = useToast();


    const [searchQuery, setSearchQuery] = useState('');
    const [liveResults, setLiveResults] = useState<any[]>([]);
    const [waitingCount, setWaitingCount] = useState(0);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setLiveResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchWaitingCount = async () => {
            const today = new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD
            const { count } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('date', today)
                .in('status', ['Confirmed', 'Checked-In', 'Pending']);
            setWaitingCount(count || 0);
        };

        fetchWaitingCount();

        // Sub-second Real-time Sync for Waiting Count
        const channel = supabase
            .channel('public:appointments:waiting_count')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                fetchWaitingCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 1) {
            const { data } = await supabase
                .from('patients')
                .select('id, name, phone, gender, age')
                .or(`name.ilike.%${query}%,id.ilike.%${query}%,phone.ilike.%${query}%`)
                .limit(6);
            setLiveResults(data || []);
        } else {
            setLiveResults([]);
        }
    };

    const handleSelectPatient = async (p: any) => {
        const { data } = await supabase.from('patients').select('*, patient_history(*)').eq('id', p.id).single();
        setGlobalPatient(data);
        setActiveTab('patient-overview');
        showToast(`Loaded: ${p.name}`, 'success');
        setSearchQuery('');
        setLiveResults([]);
    };

    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const { data } = await supabase
                .from('patients')
                .select('*, patient_history(*)')
                .or(`name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
                .limit(1);

            if (data && data.length > 0) {
                setGlobalPatient(data[0]);
                setActiveTab('patient-overview');
                showToast(`Found: ${data[0].name}`, 'success');
            } else {
                showToast('No patient found with that ID, Name or Phone', 'error');
            }
            setSearchQuery('');
            setLiveResults([]);
        }
    };

    return (
        <div className={`h-20 border-b ${theme === 'dark' ? 'border-white/5 bg-background-light/40 shadow-glass' : 'border-slate-200 bg-white shadow-sm'} backdrop-blur-2xl sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 transition-all duration-300`}>
            <div className="flex items-center gap-4 flex-1">
                <button onClick={toggleMenu} className={`lg:hidden p-2.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Menu size={24} />
                </button>

                {['admin', 'staff', 'doctor'].includes(userRole) && (
                    <div ref={searchRef} className="relative w-full max-w-md hidden md:block group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            id="global-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearch}
                            placeholder="Global Search (Name, Patient ID, Phone)..."
                            className={`w-full ${theme === 'dark' ? 'bg-surface/40 border-white/10 shadow-glass focus:shadow-neon focus:ring-primary/20 backdrop-blur-md' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-blue-500/20'} border rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-text-dark placeholder-slate-500 font-medium`}
                        />
                        {liveResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-200 rounded-2xl shadow-premium overflow-hidden z-50 animate-slide-up ring-1 ring-slate-900/5">
                                <div className="p-3 border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400   text-center">
                                    Live Results — Quick Access
                                </div>
                                {liveResults.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleSelectPatient(p)}
                                        className="p-3.5 cursor-pointer hover:bg-primary/5 transition-all flex items-center gap-3 border-b border-slate-50 last:border-0 hover:pl-5 group/item"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-text-dark group-hover/item:text-primary transition-colors">{p.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium  ">{p.id} • {p.phone}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 md:gap-4 text-slate-400">
                {/* Manual role switcher hidden in production, used only by admin for development */}
                {userRole === 'admin' && (
                    <div className={`hidden xl:flex items-center gap-2 p-1.5 border rounded-full transition-all ${theme === 'dark' ? 'bg-background-soft/60 border-white/5 shadow-inner backdrop-blur-sm' : 'bg-slate-100 border-slate-200 shadow-sm'}`}>
                        {(['admin', 'staff', 'doctor', 'patient'] as UserRole[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setUserRole(r)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${userRole === r
                                    ? theme === 'dark' ? 'bg-primary/20 text-primary shadow-neon scale-105 border border-primary/30' : 'bg-white text-blue-600 shadow-md border-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}

                {['admin', 'staff', 'doctor'].includes(userRole) && waitingCount > 0 && (
                    <div className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${theme === 'dark'
                        ? 'bg-alert/5 border-alert/20 animate-pulse'
                        : 'bg-orange-50 border-orange-200 shadow-sm'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-alert shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-orange-500'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-alert' : 'text-orange-700'}`}>{waitingCount} Patients Waiting</span>
                    </div>
                )}

                <button onClick={() => setActiveTab('notifications')} className={`relative transition-all p-2.5 rounded-xl border border-transparent ${theme === 'dark'
                    ? 'text-slate-400 hover:bg-white/5 hover:border-white/10 hover:shadow-neon'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    <Bell size={20} />
                    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full border transition-all ${theme === 'dark'
                        ? 'bg-primary border-background-light shadow-neon animate-pulse'
                        : 'bg-red-500 border-white'
                        }`} />
                </button>

                <button
                    onClick={() => {
                        const newTheme = theme === 'dark' ? 'light' : 'dark';
                        setTheme(newTheme);
                        showToast(`Switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode`, 'success');
                    }}
                    className={`p-2.5 rounded-xl border border-transparent transition-all ${theme === 'dark'
                        ? 'text-slate-400 hover:text-primary hover:bg-white/5 hover:border-white/10 hover:shadow-neon'
                        : 'text-slate-500 hover:text-primary hover:bg-slate-100 hover:border-slate-200'
                        }`}
                >
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className={`p-2.5 rounded-xl border border-transparent transition-all ${theme === 'dark'
                            ? 'text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20'
                            : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                            }`}
                        title="Disconnect Clinical Node"
                    >
                        <LogOut size={20} />
                    </button>
                )}

                {['admin', 'staff', 'doctor'].includes(userRole) && (
                    <button onClick={() => setActiveTab('patient-registration')} className="bg-primary hover:bg-primary-hover text-white shadow-neon px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group border border-white/10">
                        <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="hidden xl:inline">New Patient</span>
                    </button>
                )}
            </div>

        </div>
    );
}

