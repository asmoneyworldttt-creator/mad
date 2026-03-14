
import { useState, useEffect, useCallback, memo } from 'react';
import { Search, Filter, Plus, ChevronRight, Calendar, Users, Phone, Mail, IndianRupee } from 'lucide-react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { PatientOverview } from './PatientOverview';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import { SkeletonList } from '../SkeletonLoader';
import { useAuditLog } from '../../hooks/useAuditLog';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

const PatientCard = memo(function PatientCard({ p, onClick, theme }: { p: any; onClick: () => void; theme?: string }) {
    const isDark = theme === 'dark';
    return (
        <div 
            onClick={onClick}
            className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
                isDark ? 'bg-slate-900 border-white/5 hover:border-primary/30' : 'bg-white border-slate-100 hover:border-primary/20 shadow-sm'
            }`}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                    {p.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm truncate" style={{ color: 'var(--text-dark)' }}>{p.name} {p.last_name || ''}</h4>
                        <span className="text-[9px] font-bold text-primary shrink-0">#{p.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-medium">{p.gender}, {p.age}y</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-white/5">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Phone size={11} className="text-slate-400 shrink-0" />
                    <span className="text-[10px] font-bold truncate">{p.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                    <IndianRupee size={10} className="text-emerald-500" />
                    <span className="text-[10px] font-bold">{(p.total_spent || 0).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    );
});

export function Patients({ userRole, setActiveTab, theme }: { userRole: UserRole; setActiveTab: (tab: string) => void; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const { log } = useAuditLog();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [patientsData, setPatientsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'register'>('list');

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        const { data } = await supabase.from('patients').select('*, patient_history(*)').order('created_at', { ascending: false });
        if (data) setPatientsData(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchPatients();
        log({ action: 'page_view', entity_type: 'patient_directory' });
        const channel = supabase.channel('patients_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchPatients)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchPatients]);

    const filteredPatients = patientsData.filter(p => {
        const nameMatcher = (p.name || '') + ' ' + (p.last_name || '');
        return nameMatcher.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.phone && p.phone.includes(searchTerm));
    });

    if (selectedPatient) {
        return <PatientOverview patient={selectedPatient} onBack={() => setSelectedPatient(null)} theme={theme} setActiveTab={setActiveTab} />;
    }

    return (
        <div className="animate-slide-up space-y-3 px-1 sm:px-0">
            <div className={`p-3 md:p-4 rounded-xl border shadow-sm transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Users size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-tight">Patient Directory</h2>
                            <p className="text-[9px] font-medium text-slate-500">{filteredPatients.length} Active Records</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search Name, ID or Phone..."
                                className={`w-full pl-9 pr-4 py-1.5 rounded-lg border outline-none font-bold text-xs transition-all`}
                                style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <button onClick={() => setView('register')} className="bg-primary text-white p-2 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center gap-2 text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 shrink-0">
                            <Plus size={14} /><span className="hidden sm:inline">Add Patient</span>
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />)}
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredPatients.map(p => (
                        <PatientCard key={p.id} p={p} onClick={() => setSelectedPatient(p)} theme={theme} />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center rounded-xl border-2 border-dashed border-slate-100 dark:border-white/5">
                    <Users size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No patient results found</p>
                </div>
            )}

            <PatientRegistrationModal isOpen={view === 'register'} onClose={() => setView('list')} theme={theme} />
        </div>
    );
}
