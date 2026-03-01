import { useState } from 'react';
import { Plus, Search, ArrowRightLeft, ShoppingCart, Archive } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';

export function Inventory() {
    const [activeTab, setActiveTab] = useState<'stock' | 'transactions' | 'orders'>('stock');
    const { showToast } = useToast();
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Inventory</h2>
                    <p className="text-text-muted font-medium">Manage available stock, inward/outward transactions, and purchase orders.</p>
                </div>
                {activeTab === 'transactions' && (
                    <button
                        onClick={() => setIsTransactionModalOpen(true)}
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-premium w-full md:w-auto"
                    >
                        <Plus size={16} /> Transaction
                    </button>
                )}
                {activeTab === 'orders' && (
                    <button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-premium w-full md:w-auto"
                    >
                        <Plus size={16} /> Order
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-surface border border-slate-200 rounded-xl p-1 shadow-sm w-max overflow-x-auto max-w-full">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'stock' ? 'bg-primary-light text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Archive size={16} /> Available Stock
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'transactions' ? 'bg-primary-light text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <ArrowRightLeft size={16} /> Transactions
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-primary-light text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <ShoppingCart size={16} /> Purchase Orders
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">

                {activeTab === 'stock' && (
                    <>
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex gap-4 w-full sm:w-auto">
                                <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-full sm:w-48">
                                    <option>Default Clinic</option>
                                </select>
                                <div className="relative w-full sm:w-64">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" placeholder="Search by product" className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none" />
                                </div>
                            </div>
                            <button className="text-sm font-bold pl-4 text-slate-600 hover:text-primary transition-colors border-l border-slate-200 whitespace-nowrap">Download Report</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                        <th className="p-4 whitespace-nowrap">Sr No.</th>
                                        <th className="p-4 whitespace-nowrap">Date</th>
                                        <th className="p-4 whitespace-nowrap">Clinic Name</th>
                                        <th className="p-4 whitespace-nowrap">Particular</th>
                                        <th className="p-4 whitespace-nowrap">Manufacturer</th>
                                        <th className="p-4 whitespace-nowrap">Category</th>
                                        <th className="p-4 whitespace-nowrap">Type</th>
                                        <th className="p-4 whitespace-nowrap text-right">Opening Qty</th>
                                        <th className="p-4 whitespace-nowrap text-right">Inward Qty</th>
                                        <th className="p-4 whitespace-nowrap text-right">Outward Qty</th>
                                        <th className="p-4 whitespace-nowrap text-right">Closing Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td colSpan={11} className="p-8 text-center text-slate-500 font-medium">No data available in table</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'transactions' && (
                    <>
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-center">
                            <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                                <option>Default Clinic</option>
                            </select>
                            <input type="text" placeholder="Search by" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                            <input type="date" defaultValue="2026-03-01" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                            <input type="date" defaultValue="2026-03-31" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                            <div className="flex gap-2">
                                <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none flex-1">
                                    <option>All</option>
                                    <option>Stock In</option>
                                    <option>Stock Out</option>
                                </select>
                                <button className="text-sm font-bold text-slate-600 hover:text-primary transition-colors whitespace-nowrap px-2">Report</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                        <th className="p-4 whitespace-nowrap">Sr. No.</th>
                                        <th className="p-4 whitespace-nowrap">Date</th>
                                        <th className="p-4 whitespace-nowrap">Product Name</th>
                                        <th className="p-4 whitespace-nowrap">Transaction Type</th>
                                        <th className="p-4 whitespace-nowrap">Stock In/Out</th>
                                        <th className="p-4 whitespace-nowrap text-right">Quantity</th>
                                        <th className="p-4 whitespace-nowrap text-right">Rate</th>
                                        <th className="p-4 whitespace-nowrap text-right">Grand Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">No data available in table</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'orders' && (
                    <>
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="font-bold text-text-dark">Order List</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                        <th className="p-4 whitespace-nowrap">Date</th>
                                        <th className="p-4 whitespace-nowrap">Product Name</th>
                                        <th className="p-4 whitespace-nowrap">Product Category</th>
                                        <th className="p-4 whitespace-nowrap text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No data available in table</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Transaction Modal */}
            <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title="Stock In / Out" maxWidth="max-w-3xl">
                <form onSubmit={(e) => { e.preventDefault(); showToast('Transaction Saved', 'success'); setIsTransactionModalOpen(false); }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                        {/* Left Column */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-6 mb-2">
                                <label className="text-sm font-bold text-slate-600 block w-24">Stock type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                                        <input type="radio" checked={transactionType === 'in'} onChange={() => setTransactionType('in')} className="text-primary focus:ring-primary w-4 h-4" /> Stock In
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                                        <input type="radio" checked={transactionType === 'out'} onChange={() => setTransactionType('out')} className="text-primary focus:ring-primary w-4 h-4" /> Stock Out
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Clinic</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                                    <option>Default Clinic</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Transaction type</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                                    <option>{transactionType === 'in' ? 'Stock Inward' : 'Stock Outward'}</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Search Product <span className="text-alert">*</span></label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Quantity <span className="text-alert">*</span></label>
                                <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Amount</label>
                                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Tax</label>
                                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-text-dark w-32">Grand Total</label>
                                <input type="number" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-bold input-disabled" />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Date <span className="text-alert">*</span></label>
                                <input type="date" required defaultValue="2026-03-01" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4 mt-[52px]">
                                <label className="text-sm font-bold text-slate-500 w-32">Measure Unit <span className="text-alert">*</span></label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Rate</label>
                                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Discount</label>
                                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-slate-500 w-32">Other Charges</label>
                                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="flex items-center gap-4 pt-16">
                                <label className="text-sm font-bold text-slate-500 w-32">Remarks</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-premium transition-transform active:scale-95">
                            Save
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Order Modal */}
            <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Order Details" maxWidth="max-w-2xl">
                <form onSubmit={(e) => { e.preventDefault(); showToast('Order Created', 'success'); setIsOrderModalOpen(false); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-500 w-24">Date</label>
                            <input type="date" required defaultValue="2026-03-01" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-500 w-24">Clinic</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                                <option>Default Clinic</option>
                            </select>
                        </div>
                        <div className="col-span-2 flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-500 w-24">Vendor</label>
                            <input type="text" placeholder="Search vendor" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="col-span-2 flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-500 w-24">Product</label>
                            <div className="flex gap-2 w-full">
                                <input type="text" placeholder="Search product" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                                <button type="button" className="px-4 py-2 border border-primary/30 text-primary font-bold text-sm bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">Add</button>
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center gap-4 mt-2">
                            <label className="text-sm font-bold text-slate-500 w-24">Amount</label>
                            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="col-span-2 flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-500 w-24">Additional Charges</label>
                            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="col-span-2 flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-500 w-24">Grand Total</label>
                            <input type="number" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-bold" />
                        </div>
                        <div className="col-span-2 flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-500 w-24">Balance</label>
                            <input type="number" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-bold" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                        <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-premium transition-transform active:scale-95">
                            Save
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
