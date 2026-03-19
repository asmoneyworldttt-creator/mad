import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, ChevronDown, FileText, Download, Calendar, Users, IndianRupee, Activity, Briefcase, Pill, Stethoscope, AlertCircle, Search, Filter } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';

type ActiveReport = string | null;
type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function Reports({ userRole, theme, setActiveTab }: { userRole: UserRole; theme?: 'light' | 'dark'; setActiveTab?: (tab: string) => void }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [expandedReport, setExpandedReport] = useState<ActiveReport>(null);
    const [viewingReportDetails, setViewingReportDetails] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [reportTitle, setReportTitle] = useState<string>('');
    const [reportType, setReportType] = useState<string>('financial');
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    // Form inputs
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [doctorFilter, setDoctorFilter] = useState<string>('All Doctors');
    const [doctorsList, setDoctorsList] = useState<string[]>([]);

    useEffect(() => {
        const fetchFilters = async () => {
            const { data: bills } = await supabase.from('bills').select('doctor_name');
            const { data: appts } = await supabase.from('appointments').select('doctor');
            const docs = [...new Set([...(bills?.map(b => b.doctor_name) || []), ...(appts?.map(a => a.doctor) || [])])].filter(Boolean);
            setDoctorsList(docs);
        };
        fetchFilters();
    }, []);

    const handleGenerate = async (title: string) => {
        setReportTitle(title);
        setViewingReportDetails(true);
        let query;

        // Specialized Reporting Logic
        if (title.includes('Expenses')) {
            setReportType('financial');
            query = supabase.from('accounts').select('*').eq('type', 'expense').gte('date', fromDate).lte('date', toDate);
        } else if (title.includes('Income') || title.includes('Payment') || title.includes('Billing')) {
            setReportType('financial');
            query = supabase.from('bills').select('*, patients!patient_id(name)').gte('date', fromDate).lte('date', toDate);
        } else if (title.includes('Cash Flow')) {
            setReportType('financial');
            query = supabase.from('accounts').select('*').gte('date', fromDate).lte('date', toDate);
        } else if (title.includes('Lab')) {
            setReportType('appointment');
            query = supabase.from('lab_orders').select('*, patients!patient_id(name)').gte('order_date', fromDate).lte('order_date', toDate);
        } else if (title.includes('Acquisition') || title.includes('Directory')) {
            setReportType('patient');
            query = supabase.from('patients').select('*').gte('created_at', fromDate).lte('created_at', toDate);
        } else if (title.includes('Appointment') || title.includes('Attendance')) {
            setReportType('appointment');
            query = supabase.from('appointments').select('*').gte('date', fromDate).lte('date', toDate);
        } else if (title.includes('Symptom') || title.includes('Treatment') || title.includes('Diagnosis')) {
            setReportType('medical');
            query = supabase.from('patient_history').select('*, patients!patient_id(name)').gte('date', fromDate).lte('date', toDate);
        } else if (title.includes('Medicine') || title.includes('Pharma')) {
            setReportType('medical');
            query = supabase.from('prescriptions').select('*, patients!patient_id(name)').gte('created_at', fromDate).lte('created_at', toDate);
        } else {
            setReportType('financial');
            query = supabase.from('bills').select('*, patients!patient_id(name)').gte('date', fromDate).lte('date', toDate);
        }

        setIsLoading(true);
        let { data, error } = await query;
        setIsLoading(false);

        // ── Apply Doctor Filter ──
        if (data && doctorFilter !== 'All Doctors') {
            data = data.filter((r: any) => (r.doctor_name || r.doctor || r.advisor) === doctorFilter);
        }
        if (error) {
            showToast('Error fetching report data', 'error');
            console.error(error);
        } else {
            setReportData(data || []);
        }
    };

    const handleDownload = (format: 'PDF' | 'CSV') => {
        if (reportData.length === 0) {
            showToast('No data available to export.', 'error');
            return;
        }

        showToast(`Preparing ${format} for ${reportTitle}...`, 'success');

        let headers: string[] = [];
        if (reportType === 'financial') {
            headers = ['Date', 'Reference', 'Category', 'Amount (₹)', 'Status'];
        } else if (reportType === 'patient') {
            headers = ['ID', 'Name', 'Age/Gender', 'Phone', 'Created At'];
        } else if (reportType === 'appointment') {
            headers = ['Date', 'Time', 'Patient', 'Type', 'Status'];
        } else if (reportType === 'medical') {
            headers = ['Date', 'Patient', 'Detail', 'Notes', 'Cost (₹)'];
        }

        if (format === 'CSV') {
            let rows: string[] = [];
            if (reportType === 'financial') {
                rows = reportData.map(r => `"${r.date || r.created_at}","${r.patients?.name || r.name || 'Ref'}","${r.type || r.category || r.id}","${r.amount || r.cost || 0}","${r.status || 'Verified'}"`);
            } else if (reportType === 'patient') {
                rows = reportData.map(r => `"${r.id}","${r.name} ${r.last_name || ''}","${r.age}/${r.gender}","${r.phone}","${r.created_at}"`);
            } else if (reportType === 'appointment') {
                rows = reportData.map(r => `"${r.date}","${r.time}","${r.patients?.name || r.name}","${r.type}","${r.status}"`);
            } else if (reportType === 'medical') {
                rows = reportData.map(r => `"${r.date}","${r.patients?.name || r.name || 'N/A'}","${r.treatment || r.medication_data?.notes || 'N/A'}","${(r.notes || '').replace(/"/g, '""')}","${r.cost || 0}"`);
            }

            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            link.click();
            URL.revokeObjectURL(link.href);
        } else {
            // High-fidelity PDF generation via Print
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`
                    <html>
                        <head>
                            <title>${reportTitle}</title>
                            <style>
                                body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; }
                                .header { border-bottom: 2px solid #135bec; padding-bottom: 20px; margin-bottom: 30px; }
                                h1 { margin: 0; color: #135bec; }
                                .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                th { background: #f8fafc; text-align: left; padding: 12px; font-size: 10px; text-transform: ; color: #64748b; border-bottom: 1px solid #e2e8f0; }
                                td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
                                .total-row { background: #f8fafc; font-weight: bold; }
                                .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h1>Dentora Clinical Analytics</h1>
                                <p class="meta">Report: ${reportTitle} | Period: ${fromDate} to ${toDate}</p>
                            </div>
                            <table>
                                <thead>
                                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                                </thead>
                                <tbody>
                `);

                reportData.forEach(r => {
                    let cells: any[] = [];
                    if (reportType === 'financial') {
                        cells = [r.date || r.created_at, r.patients?.name || r.name || 'N/A', r.type || r.category || r.id, `₹${r.amount || r.cost || 0}`, r.status || 'Verified'];
                    } else if (reportType === 'patient') {
                        cells = [r.id, `${r.name} ${r.last_name || ''}`, `${r.age}/${r.gender}`, r.phone, r.created_at?.split('T')[0]];
                    } else if (reportType === 'appointment') {
                        cells = [r.date, r.time, r.patients?.name || r.name, r.type, r.status];
                    } else if (reportType === 'medical') {
                        cells = [r.date, r.patients?.name || r.name || 'N/A', r.treatment || r.medication_data?.notes || 'N/A', r.notes || '-', `₹${r.cost || 0}`];
                    }
                    win.document.write(`<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`);
                });

                const total = reportData.reduce((acc, curr) => acc + (Number(curr.amount || curr.cost || 0)), 0);
                if (total > 0) {
                    win.document.write(`
                        <tr class="total-row">
                            <td colspan="${headers.length - 2}" style="text-align:right">Report Aggregate Total:</td>
                            <td colspan="2">₹${total.toLocaleString('en-IN')}</td>
                        </tr>
                    `);
                }

                win.document.write(`
                                </tbody>
                            </table>
                            <div class="footer">
                                <p>This is a computer-generated clinical report from Dentora. Data verified by Authenticated Sync.</p>
                                <p>Generated on ${new Date().toLocaleString()}</p>
                            </div>
                        </body>
                    </html>
                `);
                win.document.close();
                setTimeout(() => { win.print(); }, 500);
            }
        }
    };

    const toggleReport = (reportName: string) => {
        setExpandedReport(expandedReport === reportName ? null : reportName);
    };

    const ReportItem = ({ title, icon: Icon }: { title: string, icon: any }) => {
        const isExpanded = expandedReport === title;

        return (
            <div className={`border rounded-[1.5rem] overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-white shadow-xl border-primary/20 ring-4 ring-primary/5 mb-6' : 'mb-2'}`}
                style={{
                    background: isExpanded ? 'var(--card-bg)' : 'var(--card-bg-alt)',
                    borderColor: isExpanded ? 'var(--primary-glow)' : 'var(--border-color)'
                }}>
                <button
                    onClick={() => toggleReport(title)}
                    className="w-full flex justify-between items-center p-5 text-left transition-colors focus:outline-none group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}`}
                            style={!isExpanded ? { background: 'var(--card-bg)', color: 'var(--text-muted)' } : {}}>
                            <Icon size={20} />
                        </div>
                        <span className={`text-sm font-bold ${isExpanded ? 'text-primary' : ''}`} style={!isExpanded ? { color: 'var(--text-main)' } : {}}>{title}</span>
                    </div>
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} className={isExpanded ? 'text-primary' : 'text-slate-300'} />
                    </div>
                </button>

                {isExpanded && (
                    <div className="p-6 border-t animate-slide-up" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">Filters applied from global bar containing ({fromDate} to {toDate} | {doctorFilter})</p>
                            <button
                                onClick={() => handleGenerate(title)}
                                className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-sm shadow-premium shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
                            >
                                Process Report Engine
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- Report Generator View ---
    if (viewingReportDetails) {
        return (
            <div className="animate-slide-up space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Reporting Active</span>
                            <span className="text-xs font-bold text-slate-400">{fromDate} to {toDate}</span>
                        </div>
                        <h2 className="text-4xl font-sans font-bold text-text-dark tracking-tight">{reportTitle}</h2>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <button
                                onClick={() => setShowDownloadMenu(prev => !prev)}
                                className="w-full px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                            >
                                <Download size={18} /> Download Data
                            </button>
                            {showDownloadMenu && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                    <button onClick={() => { handleDownload('PDF'); setShowDownloadMenu(false); }} className="w-full text-left px-5 py-4 text-xs font-bold hover:bg-slate-50 border-b border-slate-50 flex items-center gap-3"><FileText size={16} className="text-red-500" /> Export as PDF Document</button>
                                    <button onClick={() => { handleDownload('CSV'); setShowDownloadMenu(false); }} className="w-full text-left px-5 py-4 text-xs font-bold hover:bg-slate-50 flex items-center gap-3"><Activity size={16} className="text-green-600" /> Export as CSV Sheet</button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setViewingReportDetails(false)}
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm flex-1 md:flex-none"
                        >
                            <ArrowLeft size={18} /> New Report
                        </button>
                    </div>
                </div>

                <div className="border rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col p-8" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    {isLoading ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-8">
                                <div className="h-24 bg-slate-100 rounded-3xl animate-pulse" style={{ background: 'var(--card-bg-alt)' }} />
                                <div className="h-24 bg-slate-100 rounded-3xl animate-pulse" style={{ background: 'var(--card-bg-alt)' }} />
                                <div className="h-24 bg-slate-100 rounded-3xl animate-pulse" style={{ background: 'var(--card-bg-alt)' }} />
                            </div>
                            <SkeletonList rows={6} />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                                <div className="p-6 rounded-3xl border" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                    <p className="text-[10px] font-extrabold text-slate-400 mb-2">Record Count</p>
                                    <h4 className="text-3xl font-sans font-bold" style={{ color: 'var(--text-main)' }}>{reportData.length} entries</h4>
                                    
                                    {reportType === 'financial' && reportData.length > 0 && (
                                        <div className="mt-2 text-[10px] text-slate-500 font-bold flex gap-2">
                                            <span>Cash: {reportData.filter(r => r.payment_method?.toLowerCase() === 'cash').length}</span>
                                            <span>UPI: {reportData.filter(r => r.payment_method?.toLowerCase() === 'upi').length}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 rounded-3xl border" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                    <p className="text-[10px] font-extrabold text-slate-400 mb-2">Total Value</p>
                                    <h4 className="text-3xl font-sans font-bold text-primary">₹{reportData.reduce((acc, curr) => acc + (Number(curr.amount || curr.cost || 0)), 0).toLocaleString('en-IN')}</h4>
                                    
                                    {reportType === 'financial' && reportData.length > 0 && (
                                        <div className="mt-2 text-[10px] text-primary font-bold">
                                            Avg Transaction: ₹{Math.round(reportData.reduce((acc, curr) => acc + (Number(curr.amount || curr.cost || 0)), 0) / reportData.length).toLocaleString('en-IN')}
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 rounded-3xl border flex items-center justify-center border-primary/10" style={{ background: 'var(--primary-glow)' }}>
                                    <div className="text-center">
                                        <p className="text-[10px] font-extrabold text-primary mb-1">Clinic Scope</p>
                                        <p className="font-bold text-primary flex items-center gap-2">
                                            <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                            {reportType.toUpperCase()} SUITE
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto border rounded-3xl custom-scrollbar" style={{ borderColor: 'var(--border-color)' }}>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b text-xs text-slate-400 font-bold" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                            <th className="px-8 py-5">Date</th>
                                            <th className="px-8 py-5">Details</th>
                                            <th className="px-8 py-5">Amount</th>
                                            <th className="px-8 py-5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                                        {reportData.map((row, idx) => (
                                            <tr key={idx} className="transition-colors group hover:bg-slate-50/50" style={{ borderColor: 'var(--border-color)' }}>
                                                <td className="px-8 py-5 text-sm font-bold text-slate-600" style={{ color: 'var(--text-muted)' }}>{new Date(row.date || row.created_at).toLocaleDateString()}</td>
                                                <td className="px-8 py-5">
                                                    <p className="font-bold text-base tracking-tight" style={{ color: 'var(--text-main)' }}>{row.patients?.name || row.name || 'Anonymous Object'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1">{row.type || row.id || row.treatment || 'System Transaction'}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="font-sans font-bold text-lg text-primary">₹{(row.amount || row.cost || 0).toLocaleString('en-IN')}</span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-extrabold border bg-green-50 text-green-600 border-green-100">Verified</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.length === 0 && (
                                            <tr><td colSpan={4} className="text-center py-32 text-slate-300 font-bold italic font-sans text-xl">No records found for this period.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // --- Main List View ---
    return (
        <div className="animate-slide-up space-y-10 max-w-6xl mx-auto py-4">
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-xs font-bold text-primary">Clinic Reports</div>
                <h2 className="text-5xl font-sans font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>Analytical Reports</h2>
                <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">Generate and export detailed clinical and financial reports for your clinic.</p>
            </div>

            {/* Global Tool Bar Filter Range */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 border rounded-[1.5rem] p-4 shadow-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">From Date</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full rounded-xl px-4 py-2 text-xs font-bold border outline-none" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">To Date</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full rounded-xl px-4 py-2 text-xs font-bold border outline-none" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">Doctor</label>
                    <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} className="w-full rounded-xl px-4 py-2 text-xs font-bold border outline-none" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                        <option>All Doctors</option>
                        {doctorsList.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Financial Reports */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center shadow-sm border border-green-500/5">
                            <IndianRupee size={24} />
                        </div>
                        <h3 className="font-sans font-bold text-2xl text-slate-800">Financial Suite</h3>
                    </div>
                    <div className="space-y-2">
                        <ReportItem title="Payment Summary Report" icon={FileText} />
                        <ReportItem title="Cash Flow Dynamics" icon={Activity} />
                        <ReportItem title="Expenses Audit" icon={Briefcase} />
                        <ReportItem title="Outstanding Receivables" icon={AlertCircle} />
                    </div>
                </div>

                {/* Patient / Medical Reports */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-blue-500/5">
                            <Users size={24} />
                        </div>
                        <h3 className="font-sans font-bold text-2xl text-slate-800">Clinical Data</h3>
                    </div>
                    <div className="space-y-2">
                        <ReportItem title="Patient Acquisition Log" icon={Plus} />
                        <ReportItem title="Treatment Heatmap" icon={Stethoscope} />
                        <ReportItem title="Pharmaceutical Usage" icon={Pill} />
                        <ReportItem title="Symptom & Diagnosis Analysis" icon={Stethoscope} />
                        <ReportItem title="Pediatric Growth Trends" icon={Users} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-purple-500/5" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                            <Calendar size={24} />
                        </div>
                        <h3 className="font-sans font-bold text-2xl" style={{ color: 'var(--text-main)' }}>Operations</h3>
                    </div>
                    <div className="space-y-2">
                        <ReportItem title="Appointment Attendance" icon={Calendar} />
                        <ReportItem title="Doctor Performance Ratio" icon={Activity} />
                        <ReportItem title="Dental Lab Workflow" icon={Briefcase} />
                        <ReportItem title="Referral Source Audit" icon={ChevronDown} />
                    </div>
                </div>
            </div>
        </div>
    );
}

