import { useState } from 'react';
import { Search, Plus, Save, IndianRupee, ArrowLeft, FlaskConical, SearchX } from 'lucide-react';
import { useToast } from '../../components/Toast';

export function LabWork() {
    const { showToast } = useToast();
    const [view, setView] = useState<'list' | 'add'>('list');

    // MOCK DATA for listing
    const [orders, setOrders] = useState([
        { id: 'ORD-101', date: '2026-03-01', patient: 'Michael Chen', vendor: 'DentalTech Labs', status: 'Sent', amount: 4500 },
        { id: 'ORD-102', date: '2026-02-28', patient: 'Emma Watson', vendor: 'Ceramic Pro', status: 'Trial Received', amount: 8200 },
    ]);

    // ADD FORM STATE
    const [formData, setFormData] = useState({
        orderDate: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        doctor: 'Dr. Sarah Jenkins',
        vendor: '',
        patientSearch: '',
        selectedTeeth: [] as number[],
        preOp: [] as string[],
        prosthesis: [] as string[],
        surfaceCluster: '',
        ponticType: '',
        shades: { incisal: '', middle: '', gingival: '' },
        delivery: { metal: '', bisque: '', final: '', notes: '' },
        financial: { qty: 1, rate: 0, tax: 0, discount: 0, status: 'Handover to Lab', warranty: '' }
    });

    const handleCheckboxChange = (group: 'preOp' | 'prosthesis', value: string) => {
        setFormData(prev => {
            const list = prev[group];
            if (list.includes(value)) return { ...prev, [group]: list.filter(item => item !== value) };
            return { ...prev, [group]: [...list, value] };
        });
    };

    const toggleTooth = (tooth: number) => {
        setFormData(prev => {
            if (prev.selectedTeeth.includes(tooth)) return { ...prev, selectedTeeth: prev.selectedTeeth.filter(t => t !== tooth) };
            return { ...prev, selectedTeeth: [...prev.selectedTeeth, tooth] };
        });
    };

    const handleSaveOrder = () => {
        const totalAmount = (formData.financial.qty * formData.financial.rate) + formData.financial.tax - formData.financial.discount;
        const newOrder = {
            id: `ORD-${Math.floor(Math.random() * 1000) + 200}`,
            date: formData.orderDate,
            patient: formData.patientSearch || 'Walk-in Patient',
            vendor: formData.vendor || 'Unassigned Lab',
            status: formData.financial.status,
            amount: totalAmount
        };
        setOrders([newOrder, ...orders]);
        showToast('Lab Order created successfully!', 'success');
        setView('list');
    };

    // Tooth Map config
    const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

    if (view === 'add') {
        const { financial } = formData;
        const total = (financial.qty * financial.rate) + financial.tax - financial.discount;

        return (
            <div className="animate-slide-up space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-text-dark">Create Lab Order</h2>
                            <p className="text-sm text-text-muted font-medium">Draft a new request for dental prosthetics.</p>
                        </div>
                    </div>
                    <button onClick={handleSaveOrder} className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-premium transition-transform active:scale-95">
                        <Save size={18} /> Submit Order
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Header & Patient */}
                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><FlaskConical size={18} className="text-primary" /> Order Details</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
                                    <input type="date" value={formData.orderDate} onChange={e => setFormData({ ...formData, orderDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Time</label>
                                    <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Doctor</label>
                                    <select value={formData.doctor} onChange={e => setFormData({ ...formData, doctor: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                        <option>Dr. Sarah Jenkins</option>
                                        <option>Dr. Mark Sloan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Vendor / Lab</label>
                                    <select value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                        <option value="">Select Lab...</option>
                                        <option>DentalTech Labs</option>
                                        <option>Ceramic Pro HQ</option>
                                    </select>
                                </div>
                            </div>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Search Patient by name or phone..." value={formData.patientSearch} onChange={e => setFormData({ ...formData, patientSearch: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium" />
                            </div>
                        </div>

                        {/* Interactive Dental Chart */}
                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">Dental Chart (Universal)</h3>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 overflow-x-auto custom-scrollbar">
                                <div className="flex justify-center gap-1 mb-6 min-w-max">
                                    {upperTeeth.map(t => (
                                        <button key={t} onClick={() => toggleTooth(t)} className={`w-8 flex flex-col items-center gap-2 group transition-all`}>
                                            <div className="text-[10px] font-bold text-slate-400 group-hover:text-primary">{t}</div>
                                            <div className={`w-6 h-8 rounded border transition-colors flex items-center justify-center ${formData.selectedTeeth.includes(t) ? 'bg-primary border-primary shadow-sm shadow-primary/30' : 'bg-white border-slate-300'}`}>
                                                {/* Simple tooth mock shape */}
                                                <div className={`w-3 h-4 rounded-b-full ${formData.selectedTeeth.includes(t) ? 'bg-white' : 'bg-slate-200'}`} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-center gap-1 min-w-max">
                                    {lowerTeeth.map(t => (
                                        <button key={t} onClick={() => toggleTooth(t)} className={`w-8 flex flex-col items-center gap-2 group transition-all`}>
                                            <div className={`w-6 h-8 rounded border transition-colors flex items-center justify-center ${formData.selectedTeeth.includes(t) ? 'bg-primary border-primary shadow-sm shadow-primary/30' : 'bg-white border-slate-300'}`}>
                                                <div className={`w-3 h-4 rounded-t-full ${formData.selectedTeeth.includes(t) ? 'bg-white' : 'bg-slate-200'}`} />
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 group-hover:text-primary">{t}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                {['Bite Block', 'Special Tray', 'Bleaching Tray', 'Night Guard'].map(item => (
                                    <label key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                                        <input type="checkbox" checked={formData.preOp.includes(item)} onChange={() => handleCheckboxChange('preOp', item)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                        {item}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Prosthesis Details */}
                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">Prosthesis Details</h3>

                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Type of Prosthesis</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Crown', 'Bridge', 'Inlay', 'Onlay', 'Veneer', 'Post & Core', 'Denture'].map(item => (
                                    <label key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer bg-slate-50 border border-slate-100 py-2 px-3 rounded-lg hover:border-primary/30 transition-colors">
                                        <input type="checkbox" checked={formData.prosthesis.includes(item)} onChange={() => handleCheckboxChange('prosthesis', item)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                        {item}
                                    </label>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Surface Cluster</h4>
                                    <div className="flex gap-4">
                                        {['Smooth', 'Coarse', 'Glossy'].map(sc => (
                                            <label key={sc} className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                                                <input type="radio" name="surfaceCluster" checked={formData.surfaceCluster === sc} onChange={() => setFormData({ ...formData, surfaceCluster: sc })} className="text-primary focus:ring-primary h-4 w-4" />
                                                {sc}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pontic Type</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {['Ovate', 'Ridge Lap', 'Modified Ridge Lap', 'Sanitary'].map(pt => (
                                            <label key={pt} className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                                                <input type="radio" name="ponticType" checked={formData.ponticType === pt} onChange={() => setFormData({ ...formData, ponticType: pt })} className="text-primary focus:ring-primary h-4 w-4" />
                                                {pt}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Shade Selection (Interactive Component Mock) */}
                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">Shade Management</h3>

                            <div className="flex items-center gap-6">
                                <div className="w-24 h-32 border-2 border-slate-300 rounded-lg flex flex-col overflow-hidden relative shadow-inner">
                                    <div className="flex-1 border-b-2 border-slate-200 bg-white hover:bg-slate-50 transition-colors relative group">
                                        <div className="absolute inset-y-0 left-0 w-1 bg-blue-400 group-hover:w-full opacity-10 transition-all" />
                                    </div>
                                    <div className="flex-1 border-b-2 border-slate-200 bg-white hover:bg-slate-50 transition-colors relative group">
                                        <div className="absolute inset-y-0 left-0 w-1 bg-yellow-400 group-hover:w-full opacity-10 transition-all" />
                                    </div>
                                    <div className="flex-1 bg-red-50 hover:bg-red-100 transition-colors relative group">
                                        <div className="absolute inset-y-0 left-0 w-1 bg-red-400 group-hover:w-full opacity-10 transition-all" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Incisal Shade</label>
                                        <input type="text" placeholder="e.g. A1" value={formData.shades.incisal} onChange={e => setFormData({ ...formData, shades: { ...formData.shades, incisal: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-bold placeholder:font-medium" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Middle Shade</label>
                                        <input type="text" placeholder="e.g. B2" value={formData.shades.middle} onChange={e => setFormData({ ...formData, shades: { ...formData.shades, middle: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-bold placeholder:font-medium" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Gingival Shade</label>
                                        <input type="text" placeholder="e.g. C3" value={formData.shades.gingival} onChange={e => setFormData({ ...formData, shades: { ...formData.shades, gingival: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-sm font-bold placeholder:font-medium" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Timeline */}
                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">Delivery Dates</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Metal Trial</label>
                                    <input type="date" value={formData.delivery.metal} onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery, metal: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Bisque Trial</label>
                                    <input type="date" value={formData.delivery.bisque} onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery, bisque: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Final Trial / Delivery</label>
                                    <input type="date" value={formData.delivery.final} onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery, final: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Instructions for Lab</label>
                                    <textarea rows={2} value={formData.delivery.notes} onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery, notes: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Financials & Status */}
                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">Charges & Status</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Quantity</label>
                                    <input type="number" min="1" value={formData.financial.qty} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, qty: parseInt(e.target.value) || 1 } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Rate (₹)</label>
                                    <input type="number" value={formData.financial.rate} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, rate: parseFloat(e.target.value) || 0 } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tax (₹)</label>
                                    <input type="number" value={formData.financial.tax} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, tax: parseFloat(e.target.value) || 0 } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Discount (₹)</label>
                                    <input type="number" value={formData.financial.discount} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, discount: parseFloat(e.target.value) || 0 } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4">
                                <span className="text-lg font-bold text-text-dark">Total</span>
                                <span className="text-2xl font-bold text-primary flex items-center shadow-sm">
                                    <IndianRupee size={20} className="mr-1" /> {total}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Lab Status</label>
                                    <select value={formData.financial.status} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, status: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-600">
                                        <option>Handover to Lab</option>
                                        <option>In-Lab Production</option>
                                        <option>Received for Trial</option>
                                        <option>Delivered to Patient</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Warranty Details</label>
                                    <input type="text" placeholder="e.g. 5 Years Crown Warranty" value={formData.financial.warranty} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, warranty: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Lab Orders</h2>
                    <p className="text-text-muted font-medium">Track and process all incoming and outgoing lab requests.</p>
                </div>
                <button
                    onClick={() => setView('add')}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-premium w-full md:w-auto"
                >
                    <Plus size={16} /> New Lab Order
                </button>
            </div>

            <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
                    <div className="relative w-full max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by order id or patient..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4 whitespace-nowrap">Order No. & Date</th>
                                <th className="p-4 whitespace-nowrap">Patient Name</th>
                                <th className="p-4 whitespace-nowrap">Vendor Name</th>
                                <th className="p-4 whitespace-nowrap text-center">Status</th>
                                <th className="p-4 whitespace-nowrap text-right">Order Amount</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((o, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4">
                                        <p className="font-bold text-text-dark text-sm">{o.id}</p>
                                        <p className="text-xs font-medium text-slate-500">{o.date}</p>
                                    </td>
                                    <td className="p-4 font-bold text-sm text-slate-700">{o.patient}</td>
                                    <td className="p-4 text-sm font-medium text-slate-600">{o.vendor}</td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${o.status === 'Sent' ? 'bg-amber-100 text-amber-700' :
                                            o.status === 'Trial Received' ? 'bg-blue-100 text-blue-700' :
                                                o.status === 'Delivered to Patient' ? 'bg-green-100 text-green-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {o.status}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className="text-sm font-bold text-text-dark">₹{o.amount.toLocaleString('en-IN')}</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-xs font-bold text-primary hover:text-primary-hover px-3 py-1.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors">
                                            View/Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <SearchX size={48} className="text-slate-200 mb-4" />
                            <p className="text-slate-500 font-bold">No lab orders found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
