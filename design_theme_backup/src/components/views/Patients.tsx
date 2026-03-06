import { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, ChevronRight, Activity, Calendar } from 'lucide-react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { treatmentsMaster } from '../../data/mockData';
import { PatientOverview } from './PatientOverview';
import { PatientRegistrationModal } from './PatientRegistrationModal';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

export function Patients({ userRole, setActiveTab, theme }: { userRole: UserRole; setActiveTab: (tab: string) => void; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [treatmentFilter, setTreatmentFilter] = useState('');
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [patientsData, setPatientsData] = useState<any[]>([]);

    useEffect(() => {
        fetchPatients();

        const channel = supabase
            .channel('patients_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
                fetchPatients();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchPatients = async () => {
        const { data } = await supabase.from('patients').select('*, patient_history(*)');
        if (data) setPatientsData(data);
    };

    const filteredPatients = patientsData.filter(p => {
        const nameMatcher = p.name + ' ' + (p.last_name || '');
        const matchesSearch = nameMatcher.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'dentisphere_patients.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Patient database exported to CSV!', 'success');
    };

    if (selectedPatient) {
        return <PatientOverview patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
    }

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-sans font-bold text-text-dark tracking-tight">Patient Directory</h2>
                    <p className="text-text-muted font-medium">Manage records, view histories, and analyze patient lifetime value.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors flex-1 md:flex-none"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                    <button
                        onClick={() => { showToast('Search patient to update...', 'success'); document.getElementById('global-search-input')?.focus(); }}
                        className="px-4 py-2 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors flex-1 md:flex-none"
                    >
                        <Activity size={16} /> Update Profile
                    </button>
                    <button
                        onClick={() => setIsAddPatientOpen(true)}
                        className="bg-primary hover:bg-primary-hover text-white shadow-premium px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 flex-1 md:flex-none"
                    >
                        <Plus size={16} /> Add Patient
                    </button>
                </div>
            </div>

            <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
                    <div className="relative w-full max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm transition-all"
                        />
                    </div>
                    <div className="relative">
                        <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                            <Filter size={16} /> Filters
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-full md:w-[600px] bg-white rounded-[2rem] border border-slate-200 shadow-2xl z-50 p-8 animate-in zoom-in-95 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400   mb-4">Select Treatment Type</p>
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                            <button onClick={() => setTreatmentFilter('')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${treatmentFilter === '' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>All Treatments</button>
                                            {treatmentsMaster.map(t => (
                                                <button key={t.id} onClick={() => setTreatmentFilter(t.name)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${treatmentFilter === t.name ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-bold text-slate-400   mb-4">Time Duration</p>
                                        <div className="space-y-3">
                                            {['All Time', 'Today', 'Yesterday', 'This Week', 'This Month'].map(time => (
                                                <button key={time} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all flex justify-between items-center group">
                                                    {time}
                                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-auto pt-6 border-t border-slate-100">
                                            <button onClick={() => setIsFilterOpen(false)} className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-2xl font-bold shadow-premium shadow-primary/20 transition-all active:scale-95   text-xs">Apply Selection</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs   text-slate-500 font-bold">
                                <th className="p-4 rounded-tl-xl w-64">Patient Details</th>
                                <th className="p-4">Contact Info</th>
                                <th className="p-4 text-center">Last Visit</th>
                                <th className="p-4 text-right">Total Spent</th>
                                <th className="p-4 rounded-tr-xl"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPatients.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => setSelectedPatient(p)}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-sans shadow-sm">
                                                {p.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-dark group-hover:text-primary transition-colors">{p.name} {p.last_name}</p>
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                    <span>{p.id}</span> • <span>{p.gender}, {p.age}y</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-bold text-slate-600">{p.phone}</p>
                                        <p className="text-xs font-medium text-slate-400">{p.email}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                            <Calendar size={12} /> {p.last_visit || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className="text-sm font-bold text-text-dark">₹{(p.total_spent || 0).toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] font-bold   text-success mt-0.5">{p.patient_history?.length || 0} Visits</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all ml-auto">
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPatients.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <Activity size={48} className="text-slate-200 mb-4" />
                            <p className="text-slate-500 font-bold">No patients found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>

            <PatientRegistrationModal isOpen={isAddPatientOpen} onClose={() => setIsAddPatientOpen(false)} onSuccess={() => fetchPatients()} onNavigate={setActiveTab} />
        </div>
    );
}

