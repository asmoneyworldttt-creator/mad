import { useState, useEffect, useRef } from 'react';
import { Plus, Search, ArrowRightLeft, ShoppingCart, Archive, ChevronLeft, Package, Calendar, AlertTriangle, FileText, Smartphone, Edit3, Trash2, Truck, Check, Eye } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';
import { CustomSelect } from '../ui/CustomControls';
import { motion, AnimatePresence } from 'framer-motion';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function Inventory({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const [activeTab, setActiveTab] = useState<'stock' | 'transactions' | 'orders' | 'suppliers'>('stock');
    const [view, setView] = useState<'list' | 'add_transaction' | 'add_order'>('list');
    const { showToast } = useToast();
    const [stock, setStock] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    
    // UI Filters
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Medicine' | 'Dental Materials' | 'Consumables' | 'Equipment'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modals trigger
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null); // For edit mode

    const [itemForm, setItemForm] = useState({
        product_name: '',
        category: 'Medicine',
        quantity: 0,
        min_quantity: 5,
        cost_price: 0,
        batch_number: '',
        expiry_date: '',
        supplier_id: ''
    });

    const [transactionForm, setTransactionForm] = useState({
        productId: '',
        type: 'in',
        quantity: 0,
        date: new Date().toISOString().split('T')[0],
        remark: ''
    });

    useEffect(() => {
        fetchInventoryData();
        
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
        } else if (activeTab === 'suppliers') {
            // Fallback mock if tables don't exist yet for seamless layout presentation
            setSuppliers([
                { id: 1, name: 'MedLabs Inc', phone: '9876543210', email: 'med@lab.com', address: 'Block A, Mumbai' },
                { id: 2, name: 'Dental Solutions', phone: '9123456780', email: 'dent@sol.com', address: 'Block C, Delhi' }
            ]);
        }
        setIsLoading(false);
    };

    const handleSaveItem = async (e: any) => {
        e.preventDefault();
        if (!itemForm.product_name) return showToast('Item name is required', 'error');

        const savePayload = {
            product_name: itemForm.product_name,
            category: itemForm.category,
            quantity: Number(itemForm.quantity),
            min_quantity: Number(itemForm.min_quantity),
            unit_price: Number(itemForm.cost_price),
            sku: itemForm.batch_number || null, // Mock batch using sku 
            expiration_date: itemForm.expiry_date || null
        };

        let err;
        if (selectedItem) {
             const { error } = await supabase.from('inventory_stock').update(savePayload).eq('id', selectedItem.id);
             err = error;
        } else {
             const { error } = await supabase.from('inventory_stock').insert(savePayload);
             err = error;
        }

        if (err) {
            showToast('Error saving item: ' + err.message, 'error');
        } else {
            showToast(`Item ${selectedItem ? 'updated' : 'added'} successfully!`, 'success');
            setIsItemModalOpen(false);
            setSelectedItem(null);
            setItemForm({ product_name: '', category: 'Medicine', quantity: 0, min_quantity: 5, cost_price: 0, batch_number: '', expiry_date: '', supplier_id: '' });
            fetchInventoryData();
        }
    };

    const handleSaveTransaction = async (e: any) => {
        e.preventDefault();
        if (!transactionForm.productId && stock.length > 0) return showToast('Please select a product', 'error');

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

        if (!txError && transactionForm.productId) {
            const item = stock.find((s: any) => s.id === transactionForm.productId);
            if (item) {
                const newQty = transactionForm.type === 'in' ? (item.quantity || 0) + Number(transactionForm.quantity) : Math.max(0, (item.quantity || 0) - Number(transactionForm.quantity));
                await supabase.from('inventory_stock').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', transactionForm.productId);
            }
        }

        if (txError) showToast('Error saving transaction: ' + txError.message, 'error');
        else { showToast('Stock updated successfully!', 'success'); setView('list'); setTransactionForm({ productId: '', type: 'in', quantity: 0, date: new Date().toISOString().split('T')[0], remark: '' }); fetchInventoryData(); }
    };

    const filteredStock = stock.filter(item => {
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const isLowStock = (item: any) => item.quantity <= (item.min_quantity || 10);

    return (
        <div className="animate-slide-up space-y-4 relative overflow-hidden">
             <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div animate={{ x: [0, 40, -40, 0], y: [0, 20, -20, 0] }} transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }} className="absolute top-1/6 -left-10 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl opacity-60" />
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border shadow-xl backdrop-blur-md transition-all relative overflow-hidden`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                     <div>
                         <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Supply Management</h2>
                         <p className="text-xs font-medium mt-1 text-slate-500">Stock audit, Expiry Alerts & Procurement workflows</p>
                     </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        {activeTab === 'stock' && (
                            <button onClick={() => { setSelectedItem(null); setItemForm({ product_name: '', category: 'Medicine', quantity: 0, min_quantity: 5, cost_price: 0, batch_number: '', expiry_date: '', supplier_id: '' }); setIsItemModalOpen(true); }} className="bg-primary hover:scale-[1.02] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/20 w-full md:w-auto"><Plus size={16} /> Add Item</button>
                        )}
                        {activeTab === 'transactions' && (
                            <button onClick={() => setView('add_transaction')} className="bg-primary hover:scale-[1.02] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/20 w-full md:w-auto"><ArrowRightLeft size={16} /> Re-stock Log</button>
                        )}
                    </div>
                </div>
            </div>

            <div className={`flex p-1 rounded-2xl shadow-lg w-max border overflow-x-auto max-w-full backdrop-blur-md`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                {[['stock', 'Stock Catalogue', Archive], ['transactions', 'History Logs', ArrowRightLeft], ['orders', 'Purchase Orders', ShoppingCart], ['suppliers', 'Suppliers', Truck]].map(([tab, label, Icon]: any) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}><Icon size={14} /> {label}</button>
                ))}
            </div>

            {activeTab === 'stock' && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['All', 'Medicine', 'Dental Materials', 'Consumables', 'Equipment'].map((cat: any) => (
                        <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all border ${categoryFilter === cat ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white/5 border-transparent text-slate-500 hover:border-slate-200'}`} style={categoryFilter !== cat ? { background: 'var(--card-bg)', border: '1px solid var(--border-color)' } : {}}>{cat}</button>
                    ))}
                </div>
            )}

            <div className={`rounded-2xl border overflow-hidden shadow-xl transition-all backdrop-blur-md`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" placeholder="Search item..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold outline-none" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                             <tr className={`text-[10px] font-black border-b uppercase`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                                 <th className="px-4 py-3">Item Details</th>
                                 <th className="px-4 py-3">Available</th>
                                 <th className="px-4 py-3">Low Limit</th>
                                 <th className="px-4 py-3 text-right">Actions</th>
                             </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                            {isLoading ? (<tr><td colSpan={4} className="p-10"><SkeletonList rows={5} /></td></tr>) : 
                            activeTab === 'stock' ? (
                                filteredStock.length > 0 ? filteredStock.map((item) => {
                                    const critical = isLowStock(item);
                                    return (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-extrabold text-xs" style={{ color: 'var(--text-main)' }}>{item.product_name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] text-slate-400 font-bold bg-slate-50 dark:bg-white/5 px-1 rounded">{item.category || 'General'}</span>
                                                    {item.expiration_date && <span className="text-[9px] text-slate-400 bg-amber-500/10 text-amber-500 px-1 rounded flex items-center gap-0.5"><AlertTriangle size={8} /> Exp: {new Date(item.expiration_date).toLocaleDateString()}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-sm font-black ${critical ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{item.quantity}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400 font-bold">{item.min_quantity || 10}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => { setSelectedItem(item); setItemForm({ product_name: item.product_name, category: item.category || 'Medicine', quantity: item.quantity, min_quantity: item.min_quantity || 5, cost_price: item.unit_price || 0, batch_number: item.sku || '', expiry_date: item.expiration_date || '', supplier_id: '' }); setIsItemModalOpen(true); }} className="p-1.5 rounded-lg border text-slate-400 hover:text-primary transition-all"><Edit3 size={13} /></button>
                                            </td>
                                        </tr>
                                    );
                                }) : (<tr><td colSpan={4} className="p-20 text-center text-slate-400">No catalogue supplies found.</td></tr>)
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={selectedItem ? 'Edit Item' : 'New Catalog Item'} maxWidth='max-w-md'>
                <form onSubmit={handleSaveItem} className="space-y-3.5">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Product Name</label>
                        <input type="text" value={itemForm.product_name} onChange={e => setItemForm({...itemForm, product_name: e.target.value})} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Item name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 mb-1 block">Category</label>
                            <CustomSelect options={[{value: 'Medicine', label: 'Medicine'}, {value: 'Dental Materials', label: 'Dental Materials'}, {value: 'Consumables', label: 'Consumables'}, {value: 'Equipment', label: 'Equipment'}]} value={itemForm.category} onChange={v => setItemForm({...itemForm, category: v})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 mb-1 block">Qty</label>
                            <input type="number" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsItemModalOpen(false)} className="flex-1 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold transition-all hover:opacity-90">Save Item</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
