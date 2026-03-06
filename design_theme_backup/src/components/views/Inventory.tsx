
import { useState, useEffect } from 'react';
import { Plus, Search, ArrowRightLeft, ShoppingCart, Archive, ChevronLeft, Package, Calendar, FileText, Smartphone } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

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
            <div className="animate-slide-up space-y-8 pb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className={`p-3 border rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                            {isTransaction ? 'Log Stock Flux' : 'Initialize Smart Procurement'}
                        </h2>
                        <p className="text-slate-500 font-medium">{isTransaction ? 'Record inward/outward movement of medical supplies.' : 'AI-assisted ordering system for clinic inventory.'}</p>
                    </div>
                </div>

                <div className={`rounded-[2.5rem] shadow-sm p-10 border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                    <form onSubmit={isTransaction ? handleSaveTransaction : handleSaveOrder} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Select Product / Item</label>
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select
                                            className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none appearance-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10'}`}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Choose Item...</option>
                                            {stock.map(s => <option key={s.id} value={s.id}>{s.product_name}</option>)}
                                            {!isTransaction && (
                                                <>
                                                    <option>Latex Gloves (Blue)</option>
                                                    <option>Composite Resin A2</option>
                                                    <option>Sterilization Pouches</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Quantity</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className={`w-full border rounded-xl px-4 py-4 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Type / Urgency</label>
                                        <select className={`w-full border rounded-xl px-4 py-4 text-sm font-bold outline-none transition-all appearance-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                            {isTransaction ? (
                                                <>
                                                    <option>Restock (In)</option>
                                                    <option>Consumption (Out)</option>
                                                    <option>Adjustment</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option>Normal</option>
                                                    <option>Urgent</option>
                                                    <option>Priority</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Log Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10'}`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">{isTransaction ? 'Flux Remarks' : 'Supplier / Lab Entity'}</label>
                                    <div className="relative">
                                        {isTransaction ? <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /> : <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
                                        <input
                                            type="text"
                                            placeholder={isTransaction ? "e.g. Broken seal, Monthly consumption" : "e.g. DentalPro Suppliers, Star Lab"}
                                            className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 justify-end">
                            <button type="button" onClick={() => setView('list')} className={`px-10 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${theme === 'dark' ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel Operation</button>
                            <button type="submit" className="px-12 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover shadow-premium shadow-primary/20 transition-all active:scale-95">
                                {isTransaction ? 'Apply Flux' : 'Initialize Protocol'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>Supply Infrastructure</h2>
                    <p className="text-text-muted font-medium">Monitoring stock levels, movements, and procurement cycles.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {activeTab === 'transactions' && (
                        <button
                            onClick={() => setView('add_transaction')}
                            className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-premium shadow-primary/20 w-full md:w-auto"
                        >
                            <Plus size={18} /> Add Movement
                        </button>
                    )}
                    {activeTab === 'orders' && (
                        <button
                            onClick={() => setView('add_order')}
                            className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-premium shadow-primary/20 w-full md:w-auto"
                        >
                            <Plus size={18} /> Smart Order
                        </button>
                    )}
                </div>
            </div>

            <div className={`flex p-1 rounded-2xl shadow-sm w-max border overflow-x-auto max-w-full ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'stock' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Archive size={18} /> Available Stock
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'transactions' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <ArrowRightLeft size={18} /> Transactions
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <ShoppingCart size={18} /> Purchase Orders
                </button>
            </div>

            <div className={`rounded-[2rem] border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-[10px] font-extrabold uppercase tracking-widest border-b ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <th className="px-8 py-5">Item Identity</th>
                                <th className="px-8 py-5">Context / Info</th>
                                <th className="px-8 py-5">Current Volume</th>
                                <th className="px-8 py-5 text-right">Status / Logic</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-50'}`}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : activeTab === 'stock' ? (
                                stock.length > 0 ? stock.map((item) => (
                                    <tr key={item.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                        <td className="px-8 py-6">
                                            <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{item.product_name}</p>
                                            <p className="text-[10px] text-slate-400 font-extrabold mt-1 tracking-wider uppercase">SKU: {item.product_id || 'PROD-' + item.id}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs text-slate-500 font-medium">Updated: {new Date(item.updated_at || item.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-lg font-bold ${item.quantity <= (item.min_quantity || 10) ? 'text-red-500' : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{item.quantity}</span>
                                                <span className="text-[10px] font-extrabold text-slate-400">UNITS</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold border ${item.quantity <= (item.min_quantity || 10) ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                {item.quantity <= (item.min_quantity || 10) ? 'CRITICAL DEPLETION' : 'OPTIMAL STOCK'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold italic">No inventory nodes registered.</td>
                                    </tr>
                                )
                            ) : activeTab === 'transactions' ? (
                                transactions.length > 0 ? transactions.map((t) => (
                                    <tr key={t.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                        <td className="px-8 py-6">
                                            <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.inventory_stock?.product_name || 'Legacy Product'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{t.date}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs text-slate-500 font-medium italic">"{t.remarks || 'Standard consumption'}"</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className={`font-bold text-sm ${t.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>{t.type === 'in' ? '+' : '-'}{t.quantity} Units</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold border ${t.type === 'in' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {t.type === 'in' ? 'RESTOCK' : 'EXPENDITURE'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold italic">No supply flux recorded.</td>
                                    </tr>
                                )
                            ) : (
                                orders.length > 0 ? orders.map((o) => (
                                    <tr key={o.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                        <td className="px-8 py-6">
                                            <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{o.type || 'Custom Item'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">ORDER #{o.id}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs text-slate-500 font-bold">Patient: <span className={theme === 'dark' ? 'text-white' : 'text-slate-700'}>{o.patients?.name || 'In-House'}</span></p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{o.date}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>PO-REQ-{o.id}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="px-4 py-1.5 rounded-full text-[10px] font-extrabold border bg-primary/5 text-primary border-primary/20">
                                                {o.status || 'PROCESSING'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold italic">No procurement cycles active.</td>
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
