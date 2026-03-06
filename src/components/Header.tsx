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
        <div className={`h-20 ${theme === 'dark' ? 'border-primary/10 bg-surface/80' : 'border-slate-200 bg-slate-50 shadow-sm'} backdrop-blur-3xl sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 transition-all duration-500 ease-fluid border-b border-primary/10`}>
            <div className="flex items-center gap-4 flex-1">
                <button onClick={toggleMenu} className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ease-fluid active:scale-90 hover:scale-105 ${theme === 'dark' ? 'text-primary/70 hover:text-primary hover:bg-primary/10 hover:shadow-neon' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Menu size={24} />
                </button>

                {['admin', 'staff', 'doctor'].includes(userRole) && (
                    <div ref={searchRef} className="relative w-full max-w-md hidden md:block group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors duration-300" />
                        <input
                            id="global-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearch}
                            placeholder="Global Search (Name, Patient ID, Phone)..."
                            className={`w-full ${theme === 'dark' ? 'bg-background-dark/50 border-primary/20 shadow-inner hover:border-primary/40 focus:shadow-neon focus:ring-primary/20' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-blue-500/20'} border rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary/60 transition-all duration-300 ease-fluid text-text-main placeholder-slate-500 font-sans tracking-wide`}
                        />
                        {liveResults.length > 0 && (
                            <div className={`absolute top-full left-0 w-full mt-3 rounded-2xl overflow-hidden z-50 animate-slide-up transform-gpu ${theme === 'dark' ? 'bg-surface/95 border border-primary/20 shadow-neon backdrop-blur-xl' : 'bg-white border border-slate-200 shadow-premium'}`}>
                                <div className={`p-3 border-b text-[11px] font-display tracking-widest text-center ${theme === 'dark' ? 'border-primary/10 bg-primary/5 text-primary' : 'border-slate-100 bg-slate-50/50 text-slate-400 font-bold'}`}>
                                    Live Results — Quick Access
                                </div>
                                {liveResults.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleSelectPatient(p)}
                                        className={`p-3.5 cursor-pointer transition-all duration-300 ease-fluid flex items-center gap-3 border-b last:border-0 hover:pl-5 group/item ${theme === 'dark' ? 'border-primary/5 hover:bg-primary/10' : 'border-slate-50 hover:bg-primary/5'}`}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display font-medium text-lg shadow-inner group-hover/item:bg-primary group-hover/item:text-background transition-all duration-300 group-hover/item:shadow-neon">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-sans text-sm text-text-main group-hover/item:text-primary transition-colors duration-300">{p.name}</p>
                                            <p className="font-sans text-[11px] text-text-muted opacity-70">{p.id} • {p.phone}</p>
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
                    <div className={`hidden xl:flex items-center gap-2 p-1.5 border rounded-full transition-all duration-500 ease-fluid ${theme === 'dark' ? 'bg-surface/60 border-primary/10 shadow-inner backdrop-blur-md' : 'bg-slate-100 border-slate-200 shadow-sm'}`}>
                        {(['admin', 'staff', 'doctor', 'patient'] as UserRole[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setUserRole(r)}
                                className={`px-4 py-1.5 rounded-full text-[11px] font-display tracking-wide font-medium transition-all duration-300 ease-fluid capitalize ${userRole === r
                                    ? theme === 'dark' ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,240,255,0.4)] scale-105 border border-primary/40' : 'bg-white text-blue-600 shadow-md border-slate-200 font-bold'
                                    : 'text-text-muted hover:text-primary hover:scale-105'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}

                {['admin', 'staff', 'doctor'].includes(userRole) && waitingCount > 0 && (
                    <div className={`hidden lg:flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 ${theme === 'dark'
                        ? 'bg-alert/5 border-alert/20 animate-pulse shadow-[0_0_15px_rgba(245,166,35,0.15)]'
                        : 'bg-orange-50 border-orange-200 shadow-sm'
                        }`}>
                        <div className={`w-2 h-2 rounded-full animate-ring-pulse ${theme === 'dark' ? 'bg-alert' : 'bg-orange-500'}`} />
                        <span className={`font-display text-[11px] tracking-widest font-medium ${theme === 'dark' ? 'text-alert' : 'text-orange-700 font-bold'}`}>
                            {waitingCount} {waitingCount === 1 ? 'Patient' : 'Patients'} Waiting
                        </span>
                    </div>
                )}

                <button onClick={() => setActiveTab('notifications')} className={`relative transition-all duration-300 ease-fluid p-2.5 rounded-xl border border-transparent hover:scale-105 active:scale-90 ${theme === 'dark'
                    ? 'text-primary/60 hover:text-primary hover:bg-primary/10 hover:border-primary/20 hover:shadow-neon'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    <Bell size={20} />
                    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full border transition-all ${theme === 'dark'
                        ? 'bg-primary border-surface shadow-neon animate-pulse'
                        : 'bg-red-500 border-white'
                        }`} />
                </button>

                <button
                    onClick={() => {
                        const newTheme = theme === 'dark' ? 'light' : 'dark';
                        setTheme(newTheme);
                        showToast(`Initiating ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Protocol`, 'success');
                    }}
                    className={`p-2.5 rounded-xl border border-transparent transition-all duration-300 ease-fluid hover:scale-105 active:scale-90 ${theme === 'dark'
                        ? 'text-primary/60 hover:text-primary hover:bg-primary/10 hover:border-primary/20 hover:shadow-neon'
                        : 'text-slate-500 hover:text-primary hover:bg-slate-100 hover:border-slate-200'
                        }`}
                >
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className={`p-2.5 rounded-xl border border-transparent transition-all duration-300 ease-fluid hover:scale-105 active:scale-90 ${theme === 'dark'
                            ? 'text-danger/70 hover:text-danger hover:bg-danger/10 hover:border-danger/20 hover:shadow-[0_0_15px_rgba(255,76,76,0.2)]'
                            : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                            }`}
                        title="Disconnect Clinical Node"
                    >
                        <LogOut size={20} />
                    </button>
                )}

                {['admin', 'staff', 'doctor'].includes(userRole) && (
                    <button onClick={() => setActiveTab('patient-registration')} className="bg-transparent hover:bg-primary/10 text-primary shadow-none hover:shadow-neon px-5 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 ease-fluid hover:-translate-y-0.5 active:scale-95 group border border-primary/50 relative overflow-hidden">
                        {/* Glow Sweep Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-[150%] outline-offset-0 group-hover:transition-all group-hover:duration-700 group-hover:ease-fluid group-hover:translate-x-[150%]"></div>
                        <UserPlus size={18} className="transition-transform duration-300 ease-expo group-hover:rotate-12 group-hover:scale-110 relative z-10" />
                        <span className="hidden xl:inline font-display text-[12px] font-medium tracking-wide relative z-10">New Node</span>
                    </button>
                )}
            </div>

        </div>
    );
}

