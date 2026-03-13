
import { useState, useEffect } from 'react';
import { Plus, Search, ArrowRightLeft, ShoppingCart, Archive, ChevronLeft, Package, Calendar, FileText, Smartphone } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';
import { CustomSelect } from '../ui/CustomControls';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function Inventory({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const [activeTab, setActiveTab] = useState<'stock' | 'transactions' | 'orders'>('stock');
    const [view, setView] = useState<'list' | 'add_transaction' | 'add_order'>('list');
    const { showToast } = useToast();
    const [stock, setStock] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [transactionForm, setTransactionForm] = useState({
        productId: '',
        type: 'in',
        quantity: 0,
        date: new Date().toISOString().split('T')[0],
        remark: ''
    });

    const [orderForm, setOrderForm] = useState({
        item: '',
        vendor: '',
        quantity: 0,
        urgency: 'Normal',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchInventoryData();

        // Real-time subscription for stock changes
        const channel = supabase.channel('inventory_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_stock' }, () => fetchInventoryData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, () => fetchInventoryData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeTab]);

    const fetchInventoryData = async () => {
        setIsLoading(true);
        if (activeTab === 'stock') {
            const { data } = await supabase.from('inventory_stock').select('*').order('product_name', { ascending: true });
            setStock(data || []);
        } else if (activeTab === 'transactions') {
            const { data } = await supabase.from('inventory_transactions').select('*').order('date', { ascending: false });
            setTransactions(data || []);
        } else if (activeTab === 'orders') {
            const { data } = await supabase.from('inventory_purchase_orders').select('*').order('order_date', { ascending: false });
            setOrders(data || []);
        }
        setIsLoading(false);
    };

    const handleSaveTransaction = async (e: any) => {
        e.preventDefault();
        if (!transactionForm.productId && stock.length > 0) {
            showToast('Please select a product', 'error');
            return;
        }
        const txType = transactionForm.type === 'in' ? 'STOCK_IN' : 'STOCK_OUT';
        const { error: txError } = await supabase.from('inventory_transactions').insert({
            transaction_date: transactionForm.date,
            transaction_type: txType,
            product_id: transactionForm.productId || null,
            product_name: stock.find((s: any) => s.id === transactionForm.productId)?.product_name || 'Manual Item',
            quantity: transactionForm.quantity,
            grand_total: 0,
            remarks: transactionForm.remark
        });

        // Update current stock quantity
        if (!txError && transactionForm.productId) {
            const item = stock.find((s: any) => s.id === transactionForm.productId);
            if (item) {
                const newQty = transactionForm.type === 'in'
                    ? (item.quantity || 0) + Number(transactionForm.quantity)
                    : Math.max(0, (item.quantity || 0) - Number(transactionForm.quantity));
                await supabase.from('inventory_stock').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', transactionForm.productId);
            }
        }

        if (txError) {
            showToast('Error saving transaction: ' + txError.message, 'error');
        } else {
            showToast('Inventory movement recorded successfully!', 'success');
            setView('list');
            setTransactionForm({ productId: '', type: 'in', quantity: 0, date: new Date().toISOString().split('T')[0], remark: '' });
            fetchInventoryData();
        }
    };

    const handleSaveOrder = async (e: any) => {
        e.preventDefault();
        const { error } = await supabase.from('inventory_purchase_orders').insert({
            order_date: orderForm.date,
            vendor_name: orderForm.vendor || 'TBD',
            product_name: orderForm.item,
            order_status: orderForm.urgency === 'Urgent' ? 'Urgent' : 'Pending',
            grand_total: 0
        });

        if (error) {
            showToast('Error placing order: ' + error.message, 'error');
        } else {
            showToast('Smart Order placed! Supplier will be notified.', 'success');
            setView('list');
            setOrderForm({ item: '', vendor: '', quantity: 0, urgency: 'Normal', date: new Date().toISOString().split('T')[0] });
            fetchInventoryData();
        }
    };

    if (view === 'add_transaction' || view === 'add_order') {
        const isTransaction = view === 'add_transaction';
        return (
            <div className="animate-slide-up space-y-4 pb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className={`p-2.5 border rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>
                            {isTransaction ? 'Log Movement' : 'New Procurement'}
                        </h2>
                        <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{isTransaction ? 'Inward/outward movement' : 'AI-assisted ordering system'}</p>
                    </div>
                </div>

                <div className={`rounded-2xl shadow-xl p-6 border transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <form onSubmit={isTransaction ? handleSaveTransaction : handleSaveOrder} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Item Selection</label>
                                    <CustomSelect
                                        options={[
                                            ...stock.map(s => ({ value: s.id, label: s.product_name })),
                                            ...(isTransaction ? [] : [
                                                { value: 'gloves', label: 'Latex Gloves (Blue)' },
                                                { value: 'resin', label: 'Composite Resin A2' },
                                                { value: 'pouches', label: 'Sterilization Pouches' }
                                            ])
                                        ]}
                                        value={transactionForm.productId}
                                        onChange={(val) => setTransactionForm({ ...transactionForm, productId: val })}
                                        placeholder="Choose Item..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Quantity</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Velocity / Context</label>
                                        <CustomSelect
                                            options={isTransaction ? [
                                                { value: 'in', label: 'Restock (In)' },
                                                { value: 'out', label: 'Consumption (Out)' },
                                                { value: 'adj', label: 'Adjustment' }
                                            ] : [
                                                { value: 'Normal', label: 'Normal' },
                                                { value: 'Urgent', label: 'Urgent' },
                                                { value: 'Priority', label: 'Priority' }
                                            ]}
                                            value={isTransaction ? transactionForm.type : orderForm.urgency}
                                            onChange={(val) => isTransaction ? setTransactionForm({ ...transactionForm, type: val }) : setOrderForm({ ...orderForm, urgency: val })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Log Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">{isTransaction ? 'Flux Remarks' : 'Entity'}</label>
                                    <div className="relative">
                                        {isTransaction ? <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /> : <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />}
                                        <input
                                            type="text"
                                            placeholder={isTransaction ? "Reason..." : "Supplier..."}
                                            className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs font-bold transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setView('list')} className={`px-6 py-2.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${theme === 'dark' ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Dismiss</button>
                            <button type="submit" className="px-8 py-2.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                                {isTransaction ? 'Commit Flux' : 'Deploy Order'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-4">
            <div className={`p-6 rounded-2xl border shadow-xl transition-all relative overflow-hidden`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:rotate-12 duration-700"><Archive size={80} /></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Supply Chain</h2>
                        <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Monitoring stock levels and procurement cycles.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        {activeTab === 'transactions' && (
                            <button
                                onClick={() => setView('add_transaction')}
                                className="bg-primary hover:scale-105 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 w-full md:w-auto"
                            >
                                <Plus size={16} /> Add Movement
                            </button>
                        )}
                        {activeTab === 'orders' && (
                            <button
                                onClick={() => setView('add_order')}
                                className="bg-primary hover:scale-105 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 w-full md:w-auto"
                            >
                                <Plus size={16} /> Smart Order
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={`flex p-1 rounded-2xl shadow-lg w-max border overflow-x-auto max-w-full`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'stock' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-primary/5'
                        }`}
                >
                    <Archive size={14} /> Vault
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'transactions' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-primary/5'
                        }`}
                >
                    <ArrowRightLeft size={14} /> Flux
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-primary/5'
                        }`}
                >
                    <ShoppingCart size={14} /> Chain
                </button>
            </div>

            <div className={`rounded-2xl border overflow-hidden shadow-xl transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-[9px] font-black uppercase tracking-widest border-b`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                                <th className="px-5 py-3">Item Identity</th>
                                <th className="px-5 py-3">Metadata</th>
                                <th className="px-5 py-3">Volume</th>
                                <th className="px-5 py-3 text-right">Logic</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-50'}`}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-10">
                                        <SkeletonList rows={5} />
                                    </td>
                                </tr>
                            ) : activeTab === 'stock' ? (
                                stock.length > 0 ? stock.map((item) => (
                                    <tr key={item.id} className="group transition-colors hover:bg-slate-50/50" style={{ background: 'var(--card-bg)' }}>
                                        <td className="px-5 py-3.5">
                                            <p className="font-bold text-xs" style={{ color: 'var(--text-main)' }}>{item.product_name}</p>
                                            <p className="text-[8px] text-slate-400 font-bold mt-0.5 tracking-widest uppercase">SKU: {item.product_id || 'PROD-' + item.id}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Update: {new Date(item.updated_at || item.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-base font-black ${item.quantity <= (item.min_quantity || 10) ? 'text-rose-500' : 'text-slate-700'}`} style={{ color: item.quantity <= (item.min_quantity || 10) ? '#f43f5e' : 'var(--text-main)' }}>{item.quantity}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Units</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black border uppercase tracking-widest ${item.quantity <= (item.min_quantity || 10) ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                {item.quantity <= (item.min_quantity || 10) ? 'Critical' : 'Optimal'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : !isLoading && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20">
                                            <EmptyState
                                                icon={Archive}
                                                title="Stock Vault Empty"
                                                description="No medical supplies have been registered in the system yet."
                                                actionLabel="Register Item"
                                                onAction={() => showToast('Redirecting to master item list...', 'info')}
                                            />
                                        </td>
                                    </tr>
                                )
                            ) : activeTab === 'transactions' ? (
                                transactions.length > 0 ? transactions.map((t) => (
                                    <tr key={t.id} className="group transition-colors hover:bg-slate-50/50" style={{ background: 'var(--card-bg)' }}>
                                        <td className="px-5 py-3.5">
                                            <p className="font-bold text-xs" style={{ color: 'var(--text-main)' }}>{t.inventory_stock?.product_name || 'Legacy Product'}</p>
                                            <p className="text-[8px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">{t.date}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="text-[10px] text-slate-500 font-bold italic">"{t.remarks || 'Supply flux'}"</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className={`font-black text-xs ${t.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type === 'in' ? '+' : '-'}{t.quantity}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black border uppercase tracking-widest ${t.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {t.type === 'in' ? 'Restock' : 'Usage'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : !isLoading && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20">
                                            <EmptyState
                                                icon={ArrowRightLeft}
                                                title="No Movement Logs"
                                                description="Capture inward and outward supply flux to maintain clinical accuracy."
                                                actionLabel="Log Flux"
                                                onAction={() => setView('add_transaction')}
                                            />
                                        </td>
                                    </tr>
                                )
                            ) : (
                                orders.length > 0 ? orders.map((o) => (
                                    <tr key={o.id} className="group transition-colors hover:bg-slate-50/50" style={{ background: 'var(--card-bg)' }}>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{o.type || 'Custom Item'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">ORDER #{o.id}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs text-slate-500 font-bold">Patient: <span style={{ color: 'var(--text-main)' }}>{o.patients?.name || 'In-House'}</span></p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{o.date}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>PO-REQ-{o.id}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="px-4 py-1.5 rounded-full text-[10px] font-extrabold border bg-primary/5 text-primary border-primary/20">
                                                {o.status || 'PROCESSING'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : !isLoading && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20">
                                            <EmptyState
                                                icon={ShoppingCart}
                                                title="Procurement Cycle Clear"
                                                description="All supply orders have been fulfilled or none are pending."
                                                actionLabel="Create Smart Order"
                                                onAction={() => setView('add_order')}
                                            />
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
