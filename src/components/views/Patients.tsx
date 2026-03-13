import { useState, useEffect, useCallback, memo } from 'react';
import { Search, Filter, Download, Plus, ChevronRight, Activity, Calendar, Users } from 'lucide-react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { treatmentsMaster } from '../../data/mockData';
import { PatientOverview } from './PatientOverview';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';
import { useAuditLog } from '../../hooks/useAuditLog';
import { CustomSelect } from '../ui/CustomControls';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

const PatientRow = memo(function PatientRow({ p, onClick }: { p: any; onClick: () => void }) {
    return (
        <tr
            onClick={onClick}
            className="transition-colors cursor-pointer group"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-soft)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label={`View patient record for ${p.name}`}
        >
            <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] flex-shrink-0"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                        {p.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="font-bold text-xs transition-colors" style={{ color: 'var(--text-dark)' }}>{p.name} {p.last_name}</p>
                        <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            <span>{p.id}</span> • <span>{p.gender}, {p.age}y</span>
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-2.5">
                <p className="text-[11px] font-bold" style={{ color: 'var(--text-main)' }}>{p.phone}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.email}</p>
            </td>
            <td className="px-4 py-2.5 text-center">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                    style={{ background: 'var(--card-bg-alt)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                    <Calendar size={10} aria-hidden="true" /> {p.last_visit || 'N/A'}
                </div>
            </td>
            <td className="px-4 py-2.5 text-right">
                <p className="text-[11px] font-bold" style={{ color: 'var(--text-dark)' }}>₹{(p.total_spent || 0).toLocaleString('en-IN')}</p>
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'var(--success)' }}>{p.patient_history?.length || 0} Visits</p>
            </td>
            <td className="px-4 py-2.5 text-right">
                <button className="w-6 h-6 rounded-lg flex items-center justify-center ml-auto transition-all hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label={`Open record for ${p.name}`}>
                    <ChevronRight size={14} aria-hidden="true" />
                </button>
            </td>
        </tr>
    );
});

export function Patients({ userRole, setActiveTab, theme }: { userRole: UserRole; setActiveTab: (tab: string) => void; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const { log } = useAuditLog();
    const [searchTerm, setSearchTerm] = useState('');
    const [treatmentFilter, setTreatmentFilter] = useState('');
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [patientsData, setPatientsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        const { data } = await supabase.from('patients').select('*, patient_history(*)').order('created_at', { ascending: false });
        if (data) setPatientsData(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchPatients();
        log({ action: 'page_view', entity_type: 'patient_directory' });
        const channel = supabase
            .channel('patients_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchPatients)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchPatients]);

    const filteredPatients = patientsData.filter(p => {
        const nameMatcher = (p.name || '') + ' ' + (p.last_name || '');
        const matchesSearch = nameMatcher.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.phone && p.phone.includes(searchTerm));
        const matchesTreatment = treatmentFilter === '' ? true : p.patient_history?.some((h: any) => h.treatment === treatmentFilter);
        return matchesSearch && matchesTreatment;
    });

    const handleExportCSV = () => {
        const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Phone', 'Email', 'Total Spent', 'Visits'];
        const csvContent = [
            headers.join(','),
            ...filteredPatients.map(p =>
                `"${p.id}","${p.name} ${p.last_name || ''}",${p.age},"${p.gender}","${p.phone}","${p.email}",${p.total_spent || 0},${p.patient_history?.length || 0}`
            )
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `dentora_patients_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        log({ action: 'export_report', entity_type: 'patients', metadata: { count: filteredPatients.length } });
        showToast(`Exported ${filteredPatients.length} patients to CSV`, 'success');
    };

    if (selectedPatient) {
        return <PatientOverview patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
    }

    const card = { background: 'var(--card-bg)', border: '1px solid var(--border-color)' };

    return (
        <div className="animate-slide-up space-y-4" role="main">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Patients</h1>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Directory of clinical health records
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handleExportCSV} aria-label="Export"
                        className="px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 flex-1 md:flex-none"
                        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <Download size={14} aria-hidden="true" /> Export
                    </button>
                    <button onClick={() => setIsAddPatientOpen(true)} aria-label="Add patient"
                        className="px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-white flex-1 md:flex-none shadow-lg shadow-primary/20"
                        style={{ background: 'var(--primary)' }}>
                        <Plus size={14} aria-hidden="true" /> Add Patient
                    </button>
                </div>
            </div>

            {isLoading ? (
                <SkeletonList rows={8} />
            ) : (
                <div className="rounded-2xl overflow-hidden shadow-xl" style={{ ...card, boxShadow: '0 4px 20px var(--glass-shadow)' }}>
                    {/* Search + Filter Bar */}
                    <div className="p-3 flex flex-col sm:flex-row gap-3 justify-between"
                        style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg-alt)' }}>
                        <div className="relative w-full max-w-sm">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                            <input
                                id="patient-search"
                                type="search"
                                placeholder="Lookup patients..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full rounded-xl py-1.5 pl-9 pr-4 text-xs font-bold focus:outline-none transition-all"
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                aria-label="Search patients"
                            />
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsFilterOpen(!isFilterOpen)} aria-expanded={isFilterOpen} aria-label="Open patient filters"
                                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-105"
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                <Filter size={14} aria-hidden="true" /> {treatmentFilter || 'All Treatments'}
                            </button>
                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl z-50 p-4 animate-slide-up shadow-2xl border backdrop-blur-xl"
                                    style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }} role="dialog" aria-label="Filter options" aria-modal="false">
                                    <p className="text-[9px] font-black uppercase tracking-widest mb-3 mx-1" style={{ color: 'var(--text-muted)' }}>Treatment Filter</p>
                                    <CustomSelect
                                        options={[
                                            { value: '', label: 'All Treatments' },
                                            ...treatmentsMaster.map(t => ({ value: t.name, label: t.name }))
                                        ]}
                                        value={treatmentFilter}
                                        onChange={(val) => { setTreatmentFilter(val); setIsFilterOpen(false); }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {filteredPatients.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title={searchTerm ? 'No patients found' : 'No patients yet'}
                            description={searchTerm ? `No results for "${searchTerm}". Try a different name, ID, or phone number.` : 'Start by registering your first patient to build your directory.'}
                            actionLabel={!searchTerm ? 'Register First Patient' : undefined}
                            onAction={!searchTerm ? () => setIsAddPatientOpen(true) : undefined}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left" role="table" aria-label="Patient directory">
                                <thead>
                                    <tr className="text-[9px] font-extrabold uppercase tracking-widest"
                                        style={{ background: 'var(--card-bg-alt)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                        <th scope="col" className="px-4 py-2.5">Patient</th>
                                        <th scope="col" className="px-4 py-2.5">Contact</th>
                                        <th scope="col" className="px-4 py-2.5 text-center">Last Visit</th>
                                        <th scope="col" className="px-4 py-2.5 text-right">Revenue</th>
                                        <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map((p, idx) => (
                                        <PatientRow key={p.id || idx} p={p} onClick={() => {
                                            setSelectedPatient(p);
                                            log({ action: 'view_patient', entity_type: 'patient', entity_id: p.id });
                                        }} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer count */}
                    {filteredPatients.length > 0 && (
                        <div className="px-4 py-3 flex items-center" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                            <p className="text-xs font-bold">{filteredPatients.length} of {patientsData.length} patients</p>
                        </div>
                    )}
                </div>
            )}

            <PatientRegistrationModal
                isOpen={isAddPatientOpen}
                onClose={() => setIsAddPatientOpen(false)}
                onSuccess={() => fetchPatients()}
                onNavigate={setActiveTab}
            />
        </div>
    );
}
