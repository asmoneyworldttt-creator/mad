import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Save, IndianRupee, ArrowLeft, FlaskConical, SearchX, Download, Zap } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';
import { CustomSelect } from '../ui/CustomControls';
import { downloadLabOrderPDF } from '../../utils/pdfExport';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function LabWork({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const [view, setView] = useState<'list' | 'add'>('list');

    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const groupedOrders = useMemo(() => {
        const groups: Record<string, any[]> = {};
        orders.forEach(o => {
            const pId = o.patient_id || 'manual_' + (o.metadata?.patient_name || 'unknown');
            if (!groups[pId]) groups[pId] = [];
            groups[pId].push(o);
        });
        return Object.entries(groups).map(([pId, list]) => ({
            patientId: pId,
            patientName: list[0].patients?.name || list[0].metadata?.patient_name || 'Manual Entry',
            orders: list
        }));
    }, [orders]);

    useEffect(() => {
        fetchLabOrders();
    }, []);

    const fetchLabOrders = async () => {
        setIsLoading(true);
        const { data: ordersData } = await supabase.from('lab_orders').select('*').order('order_date', { ascending: false });
        
        const mapped: any[] = [];
        if (ordersData && ordersData.length > 0) {
            const patientIds = [...new Set(ordersData.map(o => o.patient_id))];
            const { data: ptData } = await supabase.from('patients').select('id, name').in('id', patientIds);

            ordersData.forEach(o => {
                mapped.push({
                    ...o,
                    patients: ptData?.find(pt => pt.id === o.patient_id)
                });
            });
            setOrders(mapped);
        } else {
            setOrders([]);
        }
        setIsLoading(false);
    };

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

    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    useEffect(() => {
        if (formData.patientSearch.length > 2) {
            const searchPatients = async () => {
                const { data } = await supabase
                    .from('patients')
                    .select('*')
                    .or(`name.ilike.%${formData.patientSearch}%,phone.ilike.%${formData.patientSearch}%`)
                    .limit(5);
                setSearchResults(data || []);
            };
            searchPatients();
        } else {
            setSearchResults([]);
        }
    }, [formData.patientSearch]);

    const loadRecommendedAdvice = async (pId: string) => {
        const { data: notes } = await supabase
            .from('clinical_notes')
            .select('plan')
            .eq('patient_id', pId)
            .order('created_at', { ascending: false });

        if (notes && notes.length > 0) {
            try {
                for (const note of notes) {
                    const parsed = JSON.parse(note.plan);
                    const pendingLabs = (parsed?.advised_labs || []).filter((a: any) => !a.status || a.status === 'Pending');
                    
                    if (pendingLabs.length > 0) {
                        const teeth = pendingLabs.map((a: any) => parseInt(a.tooth)).filter(Number.isInteger);
                        const items = pendingLabs.map((a: any) => a.item);
                        
                        setFormData(prev => {
                            const newPreOp = [...prev.preOp];
                            const newProsthesis = [...prev.prosthesis];
                            items.forEach((i: string) => {
                                if (['Bite Block', 'Special Tray', 'Bleaching Tray', 'Night Guard'].includes(i)) newPreOp.push(i);
                                else newProsthesis.push(i);
                            });
                            
                            return {
                                ...prev,
                                selectedTeeth: [...new Set([...prev.selectedTeeth, ...teeth])],
                                preOp: [...new Set(newPreOp)],
                                prosthesis: [...new Set(newProsthesis)]
                            };
                        });
                        showToast('Advice synced from Clinical Notes', 'success');
                        return true;
                    }
                }
            } catch (e) {}
        }
        return false;
    };

    const handleSelectPatient = async (p: any) => {
        setSelectedPatient(p);
        setFormData(prev => ({ ...prev, patientSearch: p.name }));
        setSearchResults([]);
        await loadRecommendedAdvice(p.id);
    };

    const handleSaveOrder = async () => {
        if (!selectedPatient && !formData.patientSearch) return showToast('Please select a patient', 'error');
        
        const totalAmount = (formData.financial.qty * formData.financial.rate) + formData.financial.tax - formData.financial.discount;

        const orderDataToSave = {
            patient_id: selectedPatient?.id,
            lab_name: formData.vendor || 'Unknown Lab',
            status: formData.financial.status || 'Pending',
            date: formData.orderDate,
            test_name: [...formData.prosthesis, ...formData.preOp].join(', ') || 'Custom Lab Order',
            cost: totalAmount,
            metadata: {
                time: formData.time,
                doctor: formData.doctor,
                selectedTeeth: formData.selectedTeeth,
                preOp: formData.preOp,
                prosthesis: formData.prosthesis,
                surfaceCluster: formData.surfaceCluster,
                ponticType: formData.ponticType,
                shades: formData.shades,
                delivery: formData.delivery,
                financial: formData.financial,
                totalAmount,
                patient_name: selectedPatient?.name || formData.patientSearch
            }
        };

        const { data: insertedData, error } = editingOrderId 
            ? await supabase.from('lab_orders').update(orderDataToSave).eq('id', editingOrderId).select().single()
            : await supabase.from('lab_orders').insert(orderDataToSave).select().single();

        if (error) {
            showToast('Error saving lab order: ' + error.message, 'error');
        } else {
            // Sync to general patient history
            await supabase.from('patient_history').insert({
                patient_id: selectedPatient?.id,
                date: formData.orderDate,
                treatment: 'Lab Order Placed',
                notes: `Vendor: ${formData.vendor || 'Unknown'}. Status: ${formData.financial.status}`,
                category: 'Clinical',
                doctor_name: formData.doctor
            });

            showToast(`Lab Order ${editingOrderId ? 'updated' : 'created'} successfully!`, 'success');
            
            // Auto-download PDF
            handleDownloadPDF({
                ...insertedData,
                patients: selectedPatient
            });

            setView('list');
            setEditingOrderId(null);
            setSelectedPatient(null);
            setFormData({
                ...formData,
                patientSearch: '',
                selectedTeeth: [],
                preOp: [],
                prosthesis: [],
                vendor: ''
            });
            fetchLabOrders();
        }
    };

    const handleDownloadPDF = (o: any) => {
        const meta = o.metadata || {};
        downloadLabOrderPDF({
            orderId: o.id || '',
            date: o.order_date || new Date().toISOString().split('T')[0],
            patientName: o.patients?.name || meta.patient_name || 'Patient',
            patientPhone: o.patients?.phone || '',
            doctorName: meta.doctor || 'Dr. Sarah Jenkins',
            vendorName: o.vendor_name,
            teeth: meta.selectedTeeth?.join(', ') || 'N/A',
            details: `Prosthesis: ${meta.prosthesis?.join(', ') || 'N/A'}\nSurface: ${meta.surfaceCluster || 'N/A'}\nPontic: ${meta.ponticType || 'N/A'}\nNotes: ${meta.delivery?.notes || 'N/A'}`,
            status: o.order_status,
            deliveryDates: {
                trial: meta.delivery?.trial || meta.delivery?.metal,
                bisque: meta.delivery?.bisque,
                final: meta.delivery?.final
            }
        });
        showToast('Lab Order PDF downloaded!', 'success');
    };

    const handleEditOrder = (o: any) => {
        setEditingOrderId(o.id);
        const meta = o.metadata || {};
        setFormData({
            orderDate: o.order_date,
            time: meta.time || '',
            doctor: meta.doctor || '',
            vendor: o.vendor_name || '',
            patientSearch: o.patients?.name || meta.patient_name || '',
            selectedTeeth: meta.selectedTeeth || [],
            preOp: meta.preOp || [],
            prosthesis: meta.prosthesis || [],
            surfaceCluster: meta.surfaceCluster || '',
            ponticType: meta.ponticType || '',
            shades: meta.shades || { incisal: '', middle: '', gingival: '' },
            delivery: meta.delivery || { metal: '', bisque: '', final: '', notes: '' },
            financial: meta.financial || { qty: 1, rate: 0, tax: 0, discount: 0, status: o.order_status, warranty: '' }
        });
        setSelectedPatient(o.patients || null);
        setView('add');
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('lab_orders').update({ order_status: status }).eq('id', id);
        if (error) showToast(error.message, 'error');
        else {
            showToast('Status updated', 'success');
            fetchLabOrders();
        }
    };


    // Tooth Map config
    const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

    if (view === 'add') {
        const { financial } = formData;
        const total = (financial.qty * financial.rate) + financial.tax - financial.discount;

        return (
            <div className="animate-slide-up space-y-6">
                <div className={`p-10 rounded-[3rem] border shadow-2xl transition-all relative overflow-hidden mb-8`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform hover:rotate-12 duration-700"><FlaskConical size={120} /></div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <button onClick={() => { setView('list'); setEditingOrderId(null); }} className="w-14 h-14 rounded-2xl border flex items-center justify-center transition-all bg-white/5 hover:scale-110 active:scale-95 shadow-xl shadow-primary/10" style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>{editingOrderId ? 'Edit Lab Order' : 'New Lab Order'}</h2>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{editingOrderId ? 'Update existing details' : 'Create order for dental work'}</p>
                            </div>
                        </div>
                        <button onClick={handleSaveOrder} className="bg-primary hover:scale-105 active:scale-95 text-white px-10 py-4 rounded-xl text-sm font-bold flex items-center gap-3 shadow-xl shadow-primary/30 transition-all">
                            <Save size={20} /> {editingOrderId ? 'Update Order' : 'Save Lab Order'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Header & Patient */}
                        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <div className="flex justify-between items-center mb-4 border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                                <h3 className="font-sans font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-dark)' }}><FlaskConical size={20} className="text-primary" /> Order Details</h3>
                                {selectedPatient && (
                                    <button onClick={async () => {
                                        const found = await loadRecommendedAdvice(selectedPatient.id);
                                        if (!found) showToast('No advised lab items found for this patient.', 'info');
                                    }} className="px-4 py-1.5 border border-primary/30 rounded-xl text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5">
                                        <Zap size={14} /> Pull Recommended
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="text-sm font-bold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Order Date</label>
                                    <input type="date" value={formData.orderDate} onChange={e => setFormData({ ...formData, orderDate: e.target.value })} className="w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Order Time</label>
                                    <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full rounded-xl px-3 py-2.5 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Referring Doctor</label>
                                    <CustomSelect 
                                        value={formData.doctor} 
                                        onChange={val => setFormData({ ...formData, doctor: val })}
                                        options={['Dr. Sarah Jenkins', 'Dr. Mark Sloan']}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Lab / Tech Center</label>
                                    <CustomSelect 
                                        value={formData.vendor} 
                                        onChange={val => setFormData({ ...formData, vendor: val })}
                                        options={['DentalTech Labs', 'Ceramic Pro HQ']}
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="Select Patient..." value={formData.patientSearch} onChange={e => setFormData({ ...formData, patientSearch: e.target.value })} className="w-full rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none transition-all font-medium" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl z-50 overflow-hidden border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                        {searchResults.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelectPatient(p)}
                                                className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b last:border-0"
                                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-soft)'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{p.name}</p>
                                                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{p.phone}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interactive Dental Chart */}
                        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                             <h3 className="font-sans font-bold text-lg mb-4 border-b pb-2" style={{ color: 'var(--text-dark)', borderColor: 'var(--border-color)' }}>Tooth Selection</h3>
                            <div className="rounded-xl p-4 border mb-6 overflow-x-auto custom-scrollbar" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
                                <div className="flex justify-center gap-1 mb-6 min-w-max">
                                    {upperTeeth.map(t => (
                                        <button key={t} onClick={() => toggleTooth(t)} className={`w-8 flex flex-col items-center gap-2 group transition-all`}>
                                            <div className="text-xs font-bold text-slate-500 group-hover:text-primary">{t}</div>
                                            <div className="w-6 h-8 rounded border transition-colors flex items-center justify-center" style={{ background: formData.selectedTeeth.includes(t) ? 'var(--primary)' : 'var(--card-bg)', borderColor: formData.selectedTeeth.includes(t) ? 'var(--primary)' : 'var(--border-color)' }}>
                                                <div className={`w-3 h-4 rounded-b-full ${formData.selectedTeeth.includes(t) ? 'bg-white' : 'opacity-20'}`} style={{ backgroundColor: formData.selectedTeeth.includes(t) ? undefined : 'var(--text-muted)' }} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-center gap-1 min-w-max">
                                    {lowerTeeth.map(t => (
                                        <button key={t} onClick={() => toggleTooth(t)} className={`w-8 flex flex-col items-center gap-2 group transition-all`}>
                                            <div className="w-6 h-8 rounded border transition-colors flex items-center justify-center" style={{ background: formData.selectedTeeth.includes(t) ? 'var(--primary)' : 'var(--card-bg)', borderColor: formData.selectedTeeth.includes(t) ? 'var(--primary)' : 'var(--border-color)' }}>
                                                <div className={`w-3 h-4 rounded-t-full ${formData.selectedTeeth.includes(t) ? 'bg-white' : 'opacity-20'}`} style={{ backgroundColor: formData.selectedTeeth.includes(t) ? undefined : 'var(--text-muted)' }} />
                                            </div>
                                            <div className="text-xs font-bold text-slate-500 group-hover:text-primary">{t}</div>
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
                            
                            {/* Notes/Custom Remarks Box under Tooth Selection */}
                            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Notes / Custom Remarks</label>
                                <textarea rows={2} value={formData.delivery.notes} onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery, notes: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} placeholder="Notes on selections or specific remarks..."></textarea>
                            </div>
                        </div>

                        {/* Prosthesis Details */}
                        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <h3 className="font-sans font-bold text-lg mb-4 border-b pb-2" style={{ color: 'var(--text-dark)', borderColor: 'var(--border-color)' }}>Restoration Details</h3>

                            <h4 className="text-xs font-bold mb-2 mt-4" style={{ color: 'var(--text-muted)' }}>Type of Restorative Work</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Crown', 'Bridge', 'Precision Denture', 'Inlay', 'Onlay', 'Veneer', 'Post & Core', 'Denture'].map(item => (
                                    <label key={item} className="flex items-center gap-2 text-sm font-bold cursor-pointer py-2 px-3 rounded-lg border transition-colors" style={{ color: 'var(--text-main)', background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                        <input type="checkbox" checked={formData.prosthesis.includes(item)} onChange={() => handleCheckboxChange('prosthesis', item)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                        {item}
                                    </label>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Surface Texture</h4>
                                    <div className="flex gap-4">
                                        {['Smooth', 'Coarse', 'Glossy'].map(sc => (
                                            <label key={sc} className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--text-main)' }}>
                                                <input type="radio" name="surfaceCluster" checked={formData.surfaceCluster === sc} onChange={() => setFormData({ ...formData, surfaceCluster: sc })} className="text-primary focus:ring-primary h-4 w-4" />
                                                {sc}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Bridge Design</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {['Standard', 'Ridge Fit', 'Ovate', 'Sanitary'].map(pt => (
                                            <label key={pt} className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--text-main)' }}>
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
                        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <h3 className="font-sans font-bold text-lg mb-4 border-b pb-2" style={{ color: 'var(--text-dark)', borderColor: 'var(--border-color)' }}>Shade Selection</h3>

                            <div className="flex items-center gap-6">
                                <div className="w-24 h-32 border-2 rounded-lg flex flex-col overflow-hidden relative shadow-inner" style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="flex-1 border-b-2 hover:bg-white/10 transition-colors relative group" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="absolute inset-y-0 left-0 w-1 bg-blue-400 group-hover:w-full opacity-10 transition-all" />
                                    </div>
                                    <div className="flex-1 border-b-2 hover:bg-white/5 transition-colors relative group" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="absolute inset-y-0 left-0 w-1 bg-yellow-400 group-hover:w-full opacity-10 transition-all" />
                                    </div>
                                    <div className="flex-1 hover:bg-red-500/10 transition-colors relative group">
                                        <div className="absolute inset-y-0 left-0 w-1 bg-red-400 group-hover:w-full opacity-10 transition-all" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Incisal Shade</label>
                                        <input type="text" placeholder="e.g. A1" value={formData.shades.incisal} onChange={e => setFormData({ ...formData, shades: { ...formData.shades, incisal: e.target.value } })} className="w-full rounded px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Middle Shade</label>
                                        <input type="text" placeholder="e.g. B2" value={formData.shades.middle} onChange={e => setFormData({ ...formData, shades: { ...formData.shades, middle: e.target.value } })} className="w-full rounded px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Gingival Shade</label>
                                        <input type="text" placeholder="e.g. C3" value={formData.shades.gingival} onChange={e => setFormData({ ...formData, shades: { ...formData.shades, gingival: e.target.value } })} className="w-full rounded px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Timeline */}
                        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <h3 className="font-sans font-bold text-lg mb-4 border-b pb-2" style={{ color: 'var(--text-dark)', borderColor: 'var(--border-color)' }}>Delivery Schedule</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Trial Fitment</label>
                                    <input type="date" value={formData.delivery.metal} onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery, metal: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Final Fitment</label>
                                    <input type="date" value={formData.delivery.bisque} onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery, bisque: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Final Delivery</label>
                                    <input type="date" value={formData.delivery.final} onChange={e => setFormData({ ...formData, delivery: { ...formData.delivery, final: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                            </div>
                        </div>

                        {/* Financials & Status */}
                        <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <h3 className="font-sans font-bold text-lg mb-4 border-b pb-2" style={{ color: 'var(--text-dark)', borderColor: 'var(--border-color)' }}>Billing & Lifecycle</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Quantity</label>
                                    <input type="number" min="1" value={formData.financial.qty} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, qty: parseInt(e.target.value) || 1 } })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Unit Rate (₹)</label>
                                    <input type="number" value={formData.financial.rate} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, rate: parseFloat(e.target.value) || 0 } })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4">
                                <span className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>Total Order</span>
                                <span className="text-2xl font-bold text-primary flex items-center shadow-sm">
                                    <IndianRupee size={20} className="mr-1" /> {total}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Current Status</label>
                                    <CustomSelect 
                                        value={formData.financial.status} 
                                        onChange={val => setFormData({ ...formData, financial: { ...formData.financial, status: val } })}
                                        options={['Handover to Lab', 'In-Lab Production', 'Received for Trial', 'Delivered to Patient']}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Lifecycle Warranty</label>
                                    <input type="text" placeholder="e.g. 5 Years Crown Warranty" value={formData.financial.warranty} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, warranty: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-8 pb-10">
            <div className={`p-10 rounded-[3rem] border shadow-2xl transition-all relative overflow-hidden`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform group-hover:rotate-12 duration-700"><FlaskConical size={120} /></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-dark)' }}>Lab Infrastructure</h2>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Track and process all clinic restorative requests.</p>
                    </div>
                    <button
                        onClick={() => setView('add')}
                        className="bg-primary hover:scale-105 active:scale-95 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/30 w-full md:w-auto"
                    >
                        <Plus size={20} /> New Lab Order
                    </button>
                </div>
            </div>

            <div className={`rounded-[3rem] border overflow-hidden shadow-2xl transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="p-8 flex flex-col sm:flex-row gap-6 justify-between border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--card-bg-alt)' }}>
                    <div className="relative w-full max-w-sm">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Find lab record..."
                            className="w-full rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold outline-none transition-all shadow-inner"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ background: 'var(--card-bg-alt)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                <th className="px-8 py-5">Node Identity</th>
                                <th className="px-8 py-5">Patient Link</th>
                                <th className="px-8 py-5">Tech Center</th>
                                <th className="px-8 py-5 text-center">Protocol Status</th>
                                <th className="px-8 py-5 text-right">Resource Cost</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody style={{ borderColor: 'var(--border-color)' }}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <SkeletonList rows={5} />
                                    </td>
                                </tr>                             ) : groupedOrders.map((group, idx) => {
                                const isExpanded = expandedGroups.includes(group.patientId);
                                const hasMultiple = group.orders.length > 1;

                                return (
                                    <div key={group.patientId} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                                        <div onClick={() => setExpandedGroups(prev => prev.includes(group.patientId) ? prev.filter(k => k !== group.patientId) : [...prev, group.patientId])} className={`p-4 flex justify-between items-center transition-all hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer ${isExpanded ? 'bg-slate-100/50 dark:bg-white/5' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                    {group.patientName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{group.patientName}</p>
                                                    <p className="text-[10px] font-black text-primary">{group.orders.length} Lab Orders</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isExpanded ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>{isExpanded ? 'Collapse' : 'Expand'}</span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="overflow-x-auto bg-slate-50/50 dark:bg-black/10">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100/30 dark:bg-white/5">
                                                            <th className="p-3 pl-8">Order ID</th>
                                                            <th className="p-3">Lab Name</th>
                                                            <th className="p-3">Details</th>
                                                            <th className="p-3 text-center">Status</th>
                                                            <th className="p-3 text-right">Cost</th>
                                                            <th className="p-3"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.orders.map((o: any) => (
                                                            <tr key={o.id} className="border-t border-dashed dark:border-white/5 text-sm">
                                                                <td className="p-3 pl-8">
                                                                    <p className="font-bold text-xs">#{o.id?.slice(0, 8)}</p>
                                                                    <p className="text-[9px] text-slate-400">{new Date(o.date).toLocaleDateString()}</p>
                                                                </td>
                                                                <td className="p-3 text-xs font-bold">{o.lab_name || 'Generic Lab'}</td>
                                                                <td className="p-3 text-xs font-medium text-slate-500">{o.test_name}</td>
                                                                <td className="p-3 text-center">
                                                                    <select value={o.status || 'Pending'} onChange={e => handleUpdateStatus(o.id, e.target.value)} className="text-[10px] font-semibold rounded-full px-2 py-0.5 outline-none border bg-white dark:bg-slate-800 cursor-pointer">
                                                                        {['Handover to Lab', 'In-Lab Production', 'Received for Trial', 'Delivered to Patient'].map(s => <option key={s} value={s}>{s}</option>)}
                                                                    </select>
                                                                </td>
                                                                <td className="p-3 text-right font-bold text-xs">₹{o.cost || 0}</td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex justify-end gap-1 px-4">
                                                                        <button onClick={() => handleDownloadPDF(o)} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-all"><Download size={14} /></button>
                                                                        <button onClick={() => handleEditOrder(o)} className="p-1.5 text-xs font-black text-primary hover:underline">Edit</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </tbody>
                    </table>
                    {orders.length === 0 && !isLoading && (
                        <EmptyState
                            icon={FlaskConical}
                            title="No Lab Orders Yet"
                            description="No lab work has been sent out. Create a new order to start tracking."
                            actionLabel="New Lab Order"
                            onAction={() => setView('add')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

