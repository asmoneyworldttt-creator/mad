
import { useState, useEffect, useCallback, memo } from 'react';
import { Search, Filter, Plus, ChevronRight, Calendar, Users, Phone, Mail, IndianRupee } from 'lucide-react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { PatientOverview } from './PatientOverview';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import { SkeletonList } from '../SkeletonLoader';
import { useAuditLog } from '../../hooks/useAuditLog';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

const DEFAULT_TREATMENTS = [
    "Oral examination", "Periodontal charting", "Pulp vitality testing", 
    "Intraoral periapical radiograph (IOPA)", "Bitewing radiograph", "Occlusal radiograph", 
    "Orthopantomogram (OPG)", "CBCT", "Study models / intraoral scan", 
    "Oral prophylaxis (Scaling & polishing)", "Fluoride therapy", "Pit & fissure sealants", 
    "Desensitization therapy", "Oral hygiene instruction", "Composite restoration", 
    "Glass ionomer restoration", "Temporary restoration", "Core build-up", 
    "Post & core", "Pulpotomy", "Pulpectomy", 
    "RCT – Started (Access opening + BMP initiated)", "Same RCT – Dressing / Cleaning & shaping visit", "RCT – Completed (Obturation done)", 
    "Retreatment RCT", "Apexification", "Apicoectomy", 
    "Scaling & root planing", "Gingivectomy", "Flap surgery", 
    "Crown lengthening", "Bone graft / GTR", "Simple extraction", 
    "Surgical extraction", "Impacted tooth removal", "Frenectomy", 
    "Biopsy", "Alveoloplasty", "Crown (PFM / Zirconia / E-max)", 
    "Fixed partial denture (Bridge)", "Removable partial denture", "Complete denture", 
    "Veneers", "Full mouth rehabilitation", "Implant placement", 
    "Immediate implant placement", "Healing abutment placement", "Implant crown / bridge", 
    "Sinus lift", "Ridge augmentation", "Removable orthodontic appliance", 
    "Fixed orthodontic treatment (Braces)", "Clear aligners", "Retainers", 
    "Space maintainer", "Stainless steel crown (Primary teeth)", "Habit breaking appliance", "Normal scaling", "Deep scaling"
];

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
    const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Yesterday' | 'Last Month' | 'Custom'>('All');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [treatmentFilter, setTreatmentFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [treatments, setTreatments] = useState<string[]>(DEFAULT_TREATMENTS);

    useEffect(() => {
        if (patientsData.length > 0) {
            const uniqueHistoryTreatments = patientsData.flatMap(p => 
                (p.patient_history || [])
                  .map((h: any) => h.treatment)
                  .filter(Boolean)
            );
            const allUnique = Array.from(new Set([...DEFAULT_TREATMENTS, ...uniqueHistoryTreatments]));
            setTreatments(allUnique);
        }
    }, [patientsData]);

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        const { data } = await supabase.from('patients').select('*, patient_history(*), clinical_notes(*)').order('created_at', { ascending: false });
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
        const matchesSearch = nameMatcher.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.phone && p.phone.includes(searchTerm));

        if (!matchesSearch) return false;

        // Date Range Filter (by created_at)
        if (dateFilter !== 'All') {
            const createdAt = new Date(p.created_at);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            
            const lastMonth = new Date();
            lastMonth.setMonth(today.getMonth() - 1);

            if (dateFilter === 'Today') {
                if (createdAt.toDateString() !== today.toDateString()) return false;
            } else if (dateFilter === 'Yesterday') {
                if (createdAt.toDateString() !== yesterday.toDateString()) return false;
            } else if (dateFilter === 'Last Month') {
                if (createdAt < lastMonth || createdAt > today) return false;
            } else if (dateFilter === 'Custom' && customStartDate && customEndDate) {
                const start = new Date(customStartDate);
                const end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
                if (createdAt < start || createdAt > end) return false;
            }
        }

        // Combined Treatment & Status Filter
        if (treatmentFilter !== 'All' || statusFilter !== 'All') {
            const matchTreatment = (itemStr: string) => {
                if (!itemStr) return false;
                const item = itemStr.toLowerCase().replace(/[^\w\s]/g, ''); // Strip punctuation
                const filter = treatmentFilter.toLowerCase().replace(/[^\w\s]/g, '');
                return item.includes(filter) || filter.includes(item) || filter.split(' ').some(w => w.length > 2 && item.includes(w));
            };

            const history = p.patient_history || [];
            const notes = p.clinical_notes || [];
            let hasMatch = false;

            // 1. Check patient history (matches only if status filter is All)
            const hasInHistory = history.some((h: any) => h.treatment && matchTreatment(h.treatment));
            if (hasInHistory && statusFilter === 'All') {
                hasMatch = true;
            }

            // 2. Check clinical notes
            if (!hasMatch) {
                for (const note of notes) {
                    try {
                        const parsed = JSON.parse(note.plan);
                        const advised = parsed.advised || [];
                        const advised_labs = parsed.advised_labs || [];
                        const treatments_done = parsed.treatments_done || [];

                        const matchAdvised = advised.some((a: any) => {
                            const treMatch = treatmentFilter === 'All' || matchTreatment(a.treatment || '');
                            const statusMatch = statusFilter === 'All' || (a.status || 'Pending') === statusFilter;
                            return treMatch && statusMatch;
                        });

                        const matchDone = treatments_done.some((t: any) => {
                            const treMatch = treatmentFilter === 'All' || matchTreatment(t.treatment || '');
                            const statusMatch = statusFilter === 'All' || (t.status || 'Completed') === statusFilter;
                            return treMatch && statusMatch;
                        });

                        if (matchAdvised || matchDone) {
                            hasMatch = true;
                            break;
                        }

                        const matchLabs = advised_labs.some((a: any) => {
                            const labMatch = treatmentFilter === 'All' || matchTreatment(a.item || '');
                            const statusMatch = statusFilter === 'All' || (a.status || 'Pending') === statusFilter;
                            return labMatch && statusMatch;
                        });

                        if (matchAdvised || matchLabs) {
                            hasMatch = true;
                            break;
                        }
                    } catch (e) { }
                }
            }

            if (!hasMatch) return false;
        }

        return true;
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

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t dark:border-white/5">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {['All', 'Today', 'Yesterday', 'Last Month', 'Custom'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setDateFilter(f as any)} 
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${dateFilter === f ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {dateFilter === 'Custom' && (
                        <div className="flex items-center gap-1 px-1.5">
                            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-slate-50 dark:bg-white/5 border-none rounded-lg px-2 py-1 text-[10px] outline-none text-slate-500" />
                            <span className="text-[10px] text-slate-400">to</span>
                            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-slate-50 dark:bg-white/5 border-none rounded-lg px-2 py-1 text-[10px] outline-none text-slate-500" />
                         </div>
                    )}

                    <div className="ms-auto w-full sm:w-auto mt-2 sm:mt-0 flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-50/50 dark:bg-white/5 p-1 rounded-xl border dark:border-white/10">
                            {['Pending', 'In Progress', 'Completed'].map(status => (
                                <button key={status} onClick={() => setStatusFilter(statusFilter === status ? 'All' : status)} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all whitespace-nowrap ${statusFilter === status ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}>{status}</button>
                            ))}
                        </div>
                        <select 
                            value={treatmentFilter} 
                            onChange={(e) => {
                                if (e.target.value === 'ADD_NEW') {
                                    const newT = prompt('Enter new treatment name:');
                                    if (newT && !treatments.includes(newT)) {
                                        setTreatments([...treatments, newT]);
                                        setTreatmentFilter(newT);
                                    }
                                } else {
                                    setTreatmentFilter(e.target.value);
                                }
                            }}
                            className="flex-1 sm:w-44 bg-slate-50 dark:bg-white/5 border-none rounded-lg text-[10px] font-bold px-3 py-1.5 outline-none text-slate-500"
                        >
                            <option value="All">Filter by Treatment</option>
                            <option value="ADD_NEW">+ Add a New Treatment</option>
                            {treatments.map((t, i) => (
                                <option key={i} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />)}
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
