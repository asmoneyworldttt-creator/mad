import { useState } from 'react';
import { Plus, Minus, ArrowLeft, ChevronDown } from 'lucide-react';


type ActiveReport = string | null;

export function Reports() {
    const [expandedReport, setExpandedReport] = useState<ActiveReport>(null);
    const [viewingReportDetails, setViewingReportDetails] = useState<boolean>(false);

    // Form inputs
    const [fromDate, setFromDate] = useState('2026-03-01');
    const [toDate, setToDate] = useState('2026-03-31');

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        setViewingReportDetails(true);
    };

    const toggleReport = (reportName: string) => {
        if (expandedReport === reportName) {
            setExpandedReport(null);
        } else {
            setExpandedReport(reportName);
        }
    };

    const ReportItem = ({ title }: { title: string }) => {
        const isExpanded = expandedReport === title;

        return (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm mb-2 transition-all">
                <button
                    onClick={() => toggleReport(title)}
                    className="w-full flex justify-between items-center p-4 hover:bg-slate-50 transition-colors focus:outline-none"
                >
                    <span className="text-sm font-bold text-primary">{title}</span>
                    {isExpanded ? (
                        <Minus size={18} className="text-alert" />
                    ) : (
                        <Plus size={18} className="text-alert" />
                    )}
                </button>

                {isExpanded && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 animate-fade-in">
                        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-end gap-4">
                            <div className="flex-1 w-full flex flex-col sm:flex-row gap-4 items-center">
                                <div className="flex items-center gap-2 w-full">
                                    <label className="text-xs font-bold text-slate-500 whitespace-nowrap w-20">From Date</label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <label className="text-xs font-bold text-slate-500 whitespace-nowrap w-20 sm:text-right">To Date</label>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="px-6 py-2 border border-alert text-alert font-bold rounded-lg text-sm hover:bg-alert hover:text-white transition-colors whitespace-nowrap w-full sm:w-auto mt-2 sm:mt-0">
                                Generate
                            </button>
                        </form>
                    </div>
                )}
            </div>
        );
    };

    // --- Report Generator View ---
    if (viewingReportDetails) {
        return (
            <div className="animate-slide-up space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Reports</h2>
                    </div>
                    <button
                        onClick={() => setViewingReportDetails(false)}
                        className="bg-white border text-primary border-primary hover:bg-slate-50 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>

                <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col p-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                        <h3 className="font-bold text-primary text-lg">Detailed Report</h3>
                        <div className="relative group">
                            <select className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium outline-none focus:border-primary cursor-pointer w-44">
                                <option>Download Report</option>
                                <option>PDF</option>
                                <option>Excel</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="overflow-x-auto border rounded-xl border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-sm tracking-wider text-slate-700 font-bold">
                                        <th className="p-4 w-1/2 border-r border-slate-200 text-center">Payment Type</th>
                                        <th className="p-4 w-1/2 text-center">Amount (Rs.)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200">Cash</td>
                                        <td className="p-4 text-sm font-bold text-text-dark text-right">300</td>
                                    </tr>
                                    <tr className="bg-slate-50/80 border-t border-slate-200">
                                        <td className="p-4 text-sm font-black text-text-dark border-r border-slate-200">Grand Total</td>
                                        <td className="p-4 text-sm font-black text-text-dark text-right">Rs. 300.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="overflow-x-auto border rounded-xl border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-sm tracking-wider text-slate-700 font-bold">
                                        <th className="p-4 w-1/2 border-r border-slate-200 text-center">Date</th>
                                        <th className="p-4 w-1/2 text-center">Amount (Rs.)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50/50">
                                        <td className="p-4 text-sm font-medium text-slate-600 border-r border-slate-200">01-03-2026</td>
                                        <td className="p-4 text-sm font-bold text-text-dark text-right">300</td>
                                    </tr>
                                    <tr className="bg-slate-50/80 border-t border-slate-200">
                                        <td className="p-4 text-sm font-black text-text-dark border-r border-slate-200">Grand Total</td>
                                        <td className="p-4 text-sm font-black text-text-dark text-right">Rs. 300.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Main List View ---
    return (
        <div className="animate-slide-up space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Reports</h2>
                    <p className="text-text-muted font-medium">Generate detailed financial and clinical reports.</p>
                </div>
            </div>

            <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-4 md:p-6 space-y-6">

                {/* Financial Reports */}
                <div className="space-y-4">
                    <div className="bg-[#2D7A38] text-white p-3 rounded text-center font-bold shadow-sm">
                        Financial Reports
                    </div>
                    <div className="space-y-1">
                        <ReportItem title="Payment Summary Report" />
                        <ReportItem title="Cash Flow Report" />
                        <ReportItem title="Expenses Report" />
                        <ReportItem title="Outstanding Income Report" />
                        <ReportItem title="Treatment wise Report" />
                        <ReportItem title="Medicine wise Report" />
                    </div>
                </div>

                {/* Patient Reports */}
                <div className="space-y-4 pt-4">
                    <div className="bg-[#2D7A38] text-white p-3 rounded text-center font-bold shadow-sm">
                        Patient Reports
                    </div>
                    <div className="space-y-1">
                        <ReportItem title="New/Repeat Patients Report" />
                        <ReportItem title="New/Repeat Patients Category Report" />
                        <ReportItem title="Patient Details Report" />
                        <ReportItem title="Group Wise Patient Report" />
                        <ReportItem title="Category Wise Patient Report" />
                        <ReportItem title="Treatment and Payments Details" />
                        <ReportItem title="Treatment Plan Report" />
                        <ReportItem title="Fee Report" />
                        <ReportItem title="Outstanding Report" />
                        <ReportItem title="Payment Report" />
                        <ReportItem title="Patient wise Membership Details Report" />
                        <ReportItem title="Appointment Report" />
                        <ReportItem title="Birthday Report" />
                        <ReportItem title="Follow-up Due Report" />
                        <ReportItem title="Billing Report" />
                        <ReportItem title="Detailed Patient wise Fees Report" />
                    </div>
                </div>

                {/* Doctor/Clinic Reports */}
                <div className="space-y-4 pt-4">
                    <div className="bg-[#2D7A38] text-white p-3 rounded text-center font-bold shadow-sm">
                        Doctor/Clinic Reports
                    </div>
                    <div className="space-y-1">
                        <ReportItem title="Doctors wise Fees Report" />
                        <ReportItem title="Doctors wise Visits Report" />
                        <ReportItem title="Doctors wise Payment Report" />
                        <ReportItem title="Doctors wise Referred By Report" />
                        <ReportItem title="Doctors wise Referred To Report" />
                        <ReportItem title="Clinic wise Payment Report" />
                        <ReportItem title="Dental Lab Work Report" />
                    </div>
                </div>

            </div>
        </div>
    );
}
