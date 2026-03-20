
import { useState, useEffect, useCallback, memo } from 'react';
import { Search, Filter, Plus, ChevronRight, Calendar, Users, Phone, Mail, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { PatientOverview } from './PatientOverview';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import { SkeletonList } from '../SkeletonLoader';
import { useAuditLog } from '../../hooks/useAuditLog';
import { Modal } from '../Modal';
import { MasterTimeline } from './MasterTimeline';

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

interface PatientGroup {
    id: string;
    name: string;
    type: 'static' | 'dynamic';
    patientIds?: string[]; // For Static
    criteria?: {            // For Dynamic
        gender?: 'Male' | 'Female' | 'All';
        ageMin?: number;
        ageMax?: number;
        treatment?: string;
        visitCount?: number;
    };
}

const PatientCard = memo(function PatientCard({ p, onClick, theme }: { p: any; onClick: () => void; theme?: string }) {
    const isDark = theme === 'dark';
    const visitCount = p.patient_history?.length || 0;
    
    // Status Resolution Logic
    let status = 'New';
    if (p.clinical_notes?.length > 0) {
        try {
            const lastNote = p.clinical_notes[0];
            const parsed = JSON.parse(lastNote.plan);
            const advised = parsed.advised || [];
            const treatments_done = parsed.treatments_done || [];
            if (treatments_done.length > 0 && advised.length === 0) status = 'Completed';
            else if (treatments_done.length > 0) status = 'In Progress';
            else if (advised.length > 0) status = 'Pending';
        } catch (e) {}
    } else if (visitCount > 0) {
        status = 'Visited';
    }

    const statusColors: Record<string, string> = {
        'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        'In Progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'Pending': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        'New': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        'Visited': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    };

    return (
        <div 
            onClick={onClick}
            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] group relative overflow-hidden ${
                isDark ? 'bg-slate-900/80 backdrop-blur-sm border-white/5 hover:border-primary/40' : 'bg-white border-slate-100 hover:border-primary/30 shadow-sm'
            }`}
        >
            {/* Subtle Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
                {p.profile_picture_url ? (
                    <img src={p.profile_picture_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-white/10" />
                ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>
                        {p.name?.charAt(0) || 'U'}
                    </div>
                )}
                
                <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <h4 className="font-bold text-sm truncate tracking-tight" style={{ color: 'var(--text-dark)' }}>{p.name} {p.last_name || ''}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.gender}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] text-slate-500 font-bold">{p.age} Yrs</span>
                            </div>
                        </div>
                        <span className="text-[8px] font-black text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded-md self-start">#{p.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100/50 dark:border-white/5 relative z-10">
                <div className="flex items-center gap-1 min-w-0">
                    <Phone size={10} className="text-slate-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">{p.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${statusColors[status] || 'bg-slate-500/10 text-slate-500'}`}>
                        {status}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                        Visits: <span className="text-primary">{visitCount}</span>
                    </span>
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
    const [view, setView] = useState<'list' | 'register' | 'timeline'>('list');
    const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Yesterday' | 'Last Month' | 'Custom'>('All');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [treatmentFilter, setTreatmentFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [treatments, setTreatments] = useState<string[]>(DEFAULT_TREATMENTS);

    // Grouping & Quick Filter State
    const [groups, setGroups] = useState<PatientGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<PatientGroup | null>(null);
    const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    
    // Group Creation State
    const [newGroup, setNewGroup] = useState<{name: string, type: 'static' | 'dynamic', patientIds: string[], criteria: any}>({
        name: '', type: 'static', patientIds: [], criteria: { gender: 'All', ageMin: 0, ageMax: 100, treatment: 'All', visitCount: 0 }
    });

    useEffect(() => {
        const savedGroups = localStorage.getItem('patient_groups');
        if (savedGroups) {
            setGroups(JSON.parse(savedGroups));
        }
    }, []);

    const saveGroups = (updated: PatientGroup[]) => {
        setGroups(updated);
        localStorage.setItem('patient_groups', JSON.stringify(updated));
    };

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
        // 1. Quick Filters
        if (activeQuickFilter) {
            const ageNum = Number(p.age) || 0;
            const visitCount = p.patient_history?.length || 0;
             switch(activeQuickFilter) {
                case 'Male': if (p.gender !== 'Male') return false; break;
                case 'Female': if (p.gender !== 'Female') return false; break;
                case 'Female Over 30': if (p.gender !== 'Female' || ageNum <= 30) return false; break;
                case 'Female Under 30': if (p.gender !== 'Female' || ageNum >= 30) return false; break;
                case 'Male Over 30': if (p.gender !== 'Male' || ageNum <= 30) return false; break;
                case 'Male Under 30': if (p.gender !== 'Male' || ageNum >= 30) return false; break;
                case 'Children': if (ageNum >= 13) return false; break; 
                case 'Frequent': if (visitCount < 3) return false; break;
            }
        }

        // 2. Smart Groups Logic
        if (selectedGroup) {
            if (selectedGroup.type === 'static') {
                if (!selectedGroup.patientIds?.includes(p.id)) return false;
            } else if (selectedGroup.type === 'dynamic' && selectedGroup.criteria) {
                const c = selectedGroup.criteria;
                const ageNum = Number(p.age) || 0;
                if (c.gender && c.gender !== 'All' && p.gender !== c.gender) return false;
                if (c.ageMin !== undefined && ageNum < c.ageMin) return false;
                if (c.ageMax !== undefined && ageNum > c.ageMax) return false;
                if (c.visitCount !== undefined && (p.patient_history?.length || 0) < c.visitCount) return false;
                if (c.treatment && c.treatment !== 'All') {
                    const matchTr = (t: string) => t.toLowerCase().includes(c.treatment!.toLowerCase());
                    const hasTr = p.patient_history?.some((h: any) => h.treatment && matchTr(h.treatment)) ||
                        p.clinical_notes?.some((n: any) => {
                            try {
                                const par = JSON.parse(n.plan);
                                return (par.advised || []).some((a: any) => matchTr(a.treatment || '')) ||
                                       (par.treatments_done || []).some((t: any) => matchTr(t.treatment || ''));
                            } catch(e) { return false; }
                        });
                    if (!hasTr) return false;
                }
            }
        }

        const nameMatcher = (p.name || '') + ' ' + (p.last_name || '');
        const matchesSearch = nameMatcher.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.phone && p.phone.includes(searchTerm));

        if (!matchesSearch) return false;

        // Combined Date Filter (checks creation, history, and notes)
        if (dateFilter !== 'All') {
            const matchesDate = (dateStr: string) => {
                if (!dateStr) return false;
                let itemDate = new Date(dateStr);
                if (dateStr.length === 10) { // "YYYY-MM-DD"
                    itemDate = new Date(dateStr + 'T00:00:00');
                }
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                
                if (dateFilter === 'Today') {
                    return itemDate.toDateString() === today.toDateString();
                } else if (dateFilter === 'Yesterday') {
                    return itemDate.toDateString() === yesterday.toDateString();
                } else if (dateFilter === 'Last Month') {
                    const lastMonth = new Date();
                    lastMonth.setMonth(today.getMonth() - 1);
                    lastMonth.setHours(0, 0, 0, 0);
                    const todayEnd = new Date();
                    todayEnd.setHours(23, 59, 59, 999);
                    return itemDate >= lastMonth && itemDate <= todayEnd;
                } else if (dateFilter === 'Custom' && customStartDate && customEndDate) {
                    const start = new Date(customStartDate + 'T00:00:00');
                    const end = new Date(customEndDate + 'T23:59:59.999');
                    return itemDate >= start && itemDate <= end;
                }
                return false;
            };

            const hasMatchDate = matchesDate(p.created_at) ||
                (p.patient_history || []).some((h: any) => matchesDate(h.date)) ||
                (p.clinical_notes || []).some((n: any) => matchesDate(n.created_at));
            
            if (!hasMatchDate) return false;
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

    if (view === 'timeline') {
        return <MasterTimeline patients={patientsData} theme={theme} onBack={() => setView('list')} onSelectPatient={(p: any) => { setView('list'); setSelectedPatient(p); }} />;
    }

    if (view === 'register') {
        return (
            <PatientRegistrationModal
                isPage={true}
                isOpen={true}
                onClose={() => setView('list')}
                onSuccess={() => { setView('list'); fetchPatients(); }}
                onNavigate={setActiveTab}
                theme={theme}
            />
        );
    }

    if (selectedPatient) {
        return <PatientOverview patient={selectedPatient} onBack={() => setSelectedPatient(null)} theme={theme} setActiveTab={setActiveTab} />;
    }

    return (
        <div className="animate-slide-up space-y-3 px-1 sm:px-0 relative overflow-hidden">
            {/* Ambient dynamic background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div 
                    animate={{ x: [0, 40, 40, 0], y: [0, 20, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
                    className="absolute top-1/6 -left-10 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl opacity-60"
                />
                <motion.div 
                    animate={{ x: [0, -30, 30, 0], y: [0, -40, 40, 0] }}
                    transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
                    className="absolute bottom-1/3 -right-10 w-80 h-80 rounded-full bg-violet-400/10 blur-3xl opacity-60"
                />
            </div>
            <div className={`p-3 md:p-4 rounded-xl border shadow-sm transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Users size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--text-dark)' }}>Patient Directory</p>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-black/5">
                                    <button onClick={() => setView('list')} className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${(view as string) === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}>Directory</button>
                                    <button onClick={() => setView('timeline')} className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${(view as string) === 'timeline' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}>Timeline</button>
                                </div>
                            </div>
                            <p className="text-[9px] font-medium text-slate-500">{filteredPatients.length} Active Records</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search Name, ID or Phone..."
                                className={`w-full pl-9 pr-4 py-2 rounded-lg border outline-none font-bold text-xs transition-all`}
                                style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                            />
                        </div>
                        <button onClick={() => setView('register')} className="bg-primary text-white p-2 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center gap-2 text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 shrink-0">
                            <Plus size={14} /><span className="hidden sm:inline">Add Patient</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t dark:border-white/5">
                    <div className="overflow-x-auto no-scrollbar pb-0.5">
                    <div className="flex items-center gap-1.5 min-w-max">
                        {['All', 'Today', 'Yesterday', 'Last Month', 'Custom'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setDateFilter(f as any)} 
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${dateFilter === f ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
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

            {/* QUICK DASHBOARD FILTER METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {[
                    { id: 'All', label: 'All', count: patientsData.length },
                    { id: 'Male', label: 'Male', count: patientsData.filter(p => p.gender === 'Male').length },
                    { id: 'Female', label: 'Female', count: patientsData.filter(p => p.gender === 'Female').length },
                    { id: 'Female Over 30', label: 'F > 30', count: patientsData.filter(p => p.gender === 'Female' && Number(p.age) > 30).length },
                    { id: 'Male Over 30', label: 'M > 30', count: patientsData.filter(p => p.gender === 'Male' && Number(p.age) > 30).length },
                    { id: 'Children', label: 'Pediatric', count: patientsData.filter(p => (Number(p.age) || 0) < 13).length },
                    { id: 'Frequent', label: 'Frequent', count: patientsData.filter(p => (p.patient_history?.length || 0) >= 3).length },
                ].map(c => (
                    <button 
                        key={c.id} 
                        onClick={() => setActiveQuickFilter(activeQuickFilter === c.id ? null : c.id)}
                        className={`p-3 rounded-2xl border flex flex-col justify-between items-start transition-all duration-300 cursor-pointer ${
                            activeQuickFilter === c.id ? 'border-primary bg-primary/5 shadow-md -translate-y-1' : theme === 'dark' ? 'bg-slate-900 border-white/5 hover:bg-white/5' : 'bg-white border-slate-100/80 hover:shadow-md'
                        }`}
                    >
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
                        <span className="text-sm font-black mt-1" style={{ color: activeQuickFilter === c.id ? 'var(--primary)' : 'var(--text-dark)' }}>{c.count}</span>
                    </button>
                ))}
            </div>

            {/* SMART GROUPS BAR */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button 
                    onClick={() => setIsGroupModalOpen(true)} 
                    className="p-1.5 px-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 active:scale-95 hover:bg-primary/10 transition-all"
                >
                    <Plus size={12} /> Create Group
                </button>
                {groups.map(g => (
                    <button 
                        key={g.id} 
                        onClick={() => setSelectedGroup(selectedGroup?.id === g.id ? null : g)}
                        className={`p-1.5 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
                            selectedGroup?.id === g.id ? 'bg-primary text-white border-primary shadow-md' : theme === 'dark' ? 'bg-slate-900 border-white/5 text-slate-400 hover:text-white' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${g.type === 'static' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                        {g.name}
                    </button>
                ))}
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

            <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Create Smart Group">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Group Name</label>
                        <input type="text" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary/40 transition-all" placeholder="e.g., VIP Patients" />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Group Type</label>
                        <div className="flex gap-2">
                            {['static', 'dynamic'].map(t => (
                                <button key={t} onClick={() => setNewGroup({...newGroup, type: t as any})} className={`flex-1 p-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${newGroup.type === t ? 'bg-primary border-primary text-white shadow-md' : 'bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-100 dark:border-white/5'}`}>{t}</button>
                            ))}
                        </div>
                    </div>

                    {newGroup.type === 'static' ? (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Select Patients</label>
                            <div className="max-h-48 overflow-y-auto border border-slate-100 dark:border-white/5 rounded-xl divide-y dark:divide-white/5 p-1 bg-slate-50 dark:bg-slate-900/40">
                                {patientsData.map(p => (
                                    <label key={p.id} className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-white/5 rounded-lg cursor-pointer transition-all">
                                        <span className="text-xs font-bold" style={{ color: 'var(--text-dark)' }}>{p.name} {p.last_name}</span>
                                        <input type="checkbox" checked={newGroup.patientIds.includes(p.id)} onChange={e => {
                                            const updated = e.target.checked ? [...newGroup.patientIds, p.id] : newGroup.patientIds.filter(id => id !== p.id);
                                            setNewGroup({...newGroup, patientIds: updated});
                                        }} className="rounded text-primary border-slate-300 focus:ring-primary" />
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-white/5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500">Gender Criteria</label>
                                <select value={newGroup.criteria.gender} onChange={e => setNewGroup({...newGroup, criteria: {...newGroup.criteria, gender: e.target.value}})} className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg p-2 text-xs font-bold">
                                    <option value="All">All Genders</option>
                                    <option value="Male">Male Only</option>
                                    <option value="Female">Female Only</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Min Age</label>
                                    <input type="number" value={newGroup.criteria.ageMin} onChange={e => setNewGroup({...newGroup, criteria: {...newGroup.criteria, ageMin: Number(e.target.value)}})} className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg p-2 text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Max Age</label>
                                    <input type="number" value={newGroup.criteria.ageMax} onChange={e => setNewGroup({...newGroup, criteria: {...newGroup.criteria, ageMax: Number(e.target.value)}})} className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg p-2 text-xs font-bold" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500">With Treatment History</label>
                                <select value={newGroup.criteria.treatment} onChange={e => setNewGroup({...newGroup, criteria: {...newGroup.criteria, treatment: e.target.value}})} className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg p-2 text-xs font-bold">
                                    <option value="All">Any Treatment</option>
                                    {treatments.map((t, i) => (
                                        <option key={i} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <button onClick={() => {
                        if (!newGroup.name) return showToast('Group name required', 'error');
                        const group: PatientGroup = {
                            id: Math.random().toString(),
                            name: newGroup.name,
                            type: newGroup.type,
                            patientIds: newGroup.type === 'static' ? newGroup.patientIds : [],
                            criteria: newGroup.type === 'dynamic' ? newGroup.criteria : undefined
                        };
                        const updated = [...groups, group];
                        saveGroups(updated);
                        setIsGroupModalOpen(false);
                        setNewGroup({name: '', type: 'static', patientIds: [], criteria: { gender: 'All', ageMin: 0, ageMax: 100, treatment: 'All', visitCount: 0 }});
                        showToast(`Group "${newGroup.name}" created!`, 'success');
                    }} className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider mt-2 shadow-lg active:scale-98 transition-transform">Create Group</button>
                </div>
            </Modal>

            <PatientRegistrationModal isOpen={false} onClose={() => setView('list')} theme={theme} />
        </div>
    );
}
