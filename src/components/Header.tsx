import { Bell, Search, UserPlus, Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useToast } from './Toast';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';


type UserRole = 'master' | 'admin' | 'staff' | 'patient';

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
            // Search Patients
            const { data: pts } = await supabase
                .from('patients')
                .select('id, name, phone, gender, age')
                .or(`name.ilike.%${query}%,id.ilike.%${query}%,phone.ilike.%${query}%`)
                .limit(4);
                
            // Search Staff
            const { data: stf } = await supabase
                .from('staff')
                .select('id, staff_id, name, email, role')
                .or(`name.ilike.%${query}%,staff_id.ilike.%${query}%,email.ilike.%${query}%`)
                .limit(4);

            const combined = [
                ...(pts || []).map(p => ({ ...p, type: 'patient' })),
                ...(stf || []).map(s => ({ ...s, type: 'staff', id: s.id }))
            ];
            setLiveResults(combined);
        } else {
            setLiveResults([]);
        }
    };

    const handleSelectPatient = async (p: any) => {
        if (p.type === 'staff') {
            setActiveTab('settings'); // Navigate to Settings/Team view
            showToast(`Selected Staff: ${p.name}`, 'success');
        } else {
            const { data } = await supabase.from('patients').select('*, patient_history(*)').eq('id', p.id).single();
            setGlobalPatient(data);
            setActiveTab('patient-overview');
            showToast(`Loaded: ${p.name}`, 'success');
        }
        setSearchQuery('');
        setLiveResults([]);
    };

    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const { data: pt } = await supabase
                .from('patients')
                .select('*, patient_history(*)')
                .or(`name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
                .limit(1);

            if (pt && pt.length > 0) {
                setGlobalPatient(pt[0]);
                setActiveTab('patient-overview');
                showToast(`Found: ${pt[0].name}`, 'success');
                setSearchQuery('');
                setLiveResults([]);
                return;
            }

            const { data: stf } = await supabase
                .from('staff')
                .select('*')
                .or(`name.ilike.%${searchQuery}%,staff_id.ilike.%${searchQuery}%`)
                .limit(1);

            if (stf && stf.length > 0) {
                setActiveTab('settings');
                showToast(`Found Staff: ${stf[0].name}`, 'success');
            } else {
                showToast('No record found with that ID, Name or Phone', 'error');
            }
            setSearchQuery('');
            setLiveResults([]);
        }
    };

    return (
        <div className="h-16 sticky top-0 z-40 flex items-center justify-between px-4 md:px-5 transition-all duration-300"
            style={{
                background: 'var(--card-bg)',
                backdropFilter: 'blur(15px)',
                borderBottom: '1px solid var(--border-color)',
                boxShadow: '0 1px 12px var(--glass-shadow)',
            }}>
            <div className="flex items-center gap-4 flex-1">
                <button onClick={toggleMenu} className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ease-fluid active:scale-90 hover:scale-105 ${theme === 'dark' ? 'text-primary/70 hover:text-primary hover:bg-primary/10 hover:shadow-neon' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Menu size={24} />
                </button>

                {['master', 'admin', 'staff'].includes(userRole) && (
                    <div ref={searchRef} className="relative w-full max-w-sm hidden md:block group">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: 'var(--text-muted)' }} />
                        <input
                            id="global-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearch}
                            placeholder="Global Search..."
                            className="w-full rounded-full py-1.5 pl-10 pr-4 text-xs focus:outline-none transition-all duration-300 font-sans tracking-wide"
                            style={{
                                background: 'var(--card-bg-alt)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-main)',
                            }}
                        />
                        {liveResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-3 rounded-2xl overflow-hidden z-50 animate-slide-up"
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 12px 40px var(--glass-shadow)' }}>
                                <div className="p-3 border-b text-[13px] font-bold text-center"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--primary)', background: 'var(--primary-soft)' }}>
                                    Search Results — Quick Access
                                </div>
                                {liveResults.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleSelectPatient(p)}
                                        className="p-3.5 cursor-pointer transition-all duration-200 flex items-center gap-3 border-b last:border-0 hover:pl-5"
                                        style={{ borderColor: 'var(--border-subtle)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-soft)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all"
                                            style={{ background: p.type === 'staff' ? 'rgba(139, 92, 246, 0.1)' : 'var(--primary-soft)', color: p.type === 'staff' ? '#8B5CF6' : 'var(--primary)' }}>
                                            {p.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{p.name}</p>
                                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                {p.type === 'staff' ? `${p.staff_id || 'Staff'} • ${p.role}` : `${p.id} • ${p.phone}`}
                                            </p>
                                        </div>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${p.type === 'staff' ? 'bg-purple-500/10 text-purple-500' : 'bg-primary/10 text-primary'}`}>
                                            {p.type?.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 md:gap-4 text-slate-400">
                {/* Manual role switcher hidden in production, used only by admin for development */}
                {userRole === 'master' && (
                    <div className="hidden xl:flex items-center gap-2 p-1.5 border rounded-full transition-all duration-500"
                        style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                        {(['master', 'admin', 'staff', 'patient'] as UserRole[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setUserRole(r)}
                                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 capitalize hover:scale-105"
                                style={{
                                    background: userRole === r ? 'var(--primary)' : 'transparent',
                                    color: userRole === r ? '#fff' : 'var(--text-muted)',
                                    boxShadow: userRole === r ? '0 4px 15px var(--primary-glow)' : 'none',
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}

                {['master', 'admin', 'staff'].includes(userRole) && waitingCount > 0 && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border"
                        style={{ background: 'var(--warning-soft)', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--warning)' }} />
                        <span className="text-xs font-bold">
                            {waitingCount} {waitingCount === 1 ? 'Waiting' : 'Waiting'}
                        </span>
                    </div>
                )}

                <button onClick={() => setActiveTab('notifications')} className="relative transition-all duration-300 p-2.5 rounded-xl hover:scale-105 active:scale-90"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-soft)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2" style={{ borderColor: 'var(--card-bg)' }} />
                </button>

                <button
                    onClick={() => {
                        const newTheme = theme === 'dark' ? 'light' : 'dark';
                        setTheme(newTheme);
                        showToast(`Switched to ${newTheme} mode`, 'success');
                    }}
                    className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-90"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-soft)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-90 text-rose-500"
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                )}

                {['master', 'admin', 'staff'].includes(userRole) && (
                    <button onClick={() => setActiveTab('patient-registration')} className="px-4 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group font-bold text-[13px] text-white"
                        style={{ background: 'var(--primary)', boxShadow: '0 10px 25px -5px var(--primary-glow)' }}>
                        <UserPlus size={18} />
                        <span className="hidden xl:inline">New Patient</span>
                    </button>
                )}
            </div>

        </div>
    );
}

