import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Plus, Search, X, Trash2, AlertCircle, IndianRupee } from 'lucide-react';
import { api } from '../../services/api';
import { Supplier, Product, PurchaseBill, PurchaseBillItem, PurchaseBillStatus } from '../../types';

const formatINR = (val: number) => '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const STATUS_STYLES: Record<PurchaseBillStatus, string> = {
  unpaid: 'bg-amber-100 text-amber-800',
  partially_paid: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800'
};

export const PurchasesView: React.FC = () => {
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [payBill, setPayBill] = useState<PurchaseBill | null>(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchaseBills({ search: search || undefined });
      setBills(res.purchaseBills);
    } catch (err) {
      console.error('Failed to load purchase bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, [search]);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Purchases</h1>
          <p className="text-xs text-gray-500 mt-0.5">Record supplier purchase bills — stock is received into inventory automatically.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5">
          <Plus className="w-3.5 h-3.5" /><span>+ Create Purchase Bill</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by bill number or supplier..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold">
            <tr>
              <th className="py-2.5 px-4">Bill #</th>
              <th className="py-2.5 px-4">Supplier</th>
              <th className="py-2.5 px-4">Date / Due</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Total / Balance</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading...</td></tr>}
            {!loading && bills.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">No purchase bills yet.</td></tr>}
            {bills.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono font-bold text-gray-800">{b.billNumber}</td>
                <td className="py-2.5 px-4 font-semibold text-gray-900">{b.supplierName}</td>
                <td className="py-2.5 px-4 text-gray-500">{fmtDate(b.billDate)} <span className="text-gray-300">/</span> {fmtDate(b.dueDate)}</td>
                <td className="py-2.5 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLES[b.status]}`}>{b.status.replace('_', ' ')}</span></td>
                <td className="py-2.5 px-4">
                  <span className="font-bold text-gray-900">{formatINR(b.grandTotal)}</span>
                  {b.balanceDue > 0 && <span className="block text-[10px] text-red-600 font-semibold">Due: {formatINR(b.balanceDue)}</span>}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {b.balanceDue > 0 && (
                    <button onClick={() => setPayBill(b)} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                      <IndianRupee className="w-3 h-3" /><span>Pay Supplier</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && <CreatePurchaseBillModal onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchBills(); }} />}
      {payBill && <PaySupplierModal bill={payBill} onClose={() => setPayBill(null)} onSuccess={() => { setPayBill(null); fetchBills(); }} />}
    </div>
  );
};

let seq = 0;
const blankItem = (): PurchaseBillItem => ({ id: 'tmp-' + (++seq), description: '', quantity: 1, unit: 'Unit', rate: 0, taxPercent: 18, amount: 0 });

const CreatePurchaseBillModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
  const [items, setItems] = useState<PurchaseBillItem[]>([blankItem()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSuppliers().then(res => setSuppliers(res.suppliers)).catch(() => {});
    api.getProducts({}).then(res => setProducts(res.products)).catch(() => {});
  }, []);

  const totals = useMemo(() => {
    let subtotal = 0, totalTax = 0;
    items.forEach(it => {
      const base = it.quantity * it.rate;
      const tax = base * (it.taxPercent / 100);
      subtotal += base;
      totalTax += tax;
    });
    return { subtotal, totalTax, grandTotal: subtotal + totalTax };
  }, [items]);

  const updateItem = (id: string, patch: Partial<PurchaseBillItem>) => setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  const applyProduct = (id: string, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) updateItem(id, { productId: prod.id, description: prod.name, rate: prod.costPrice, unit: prod.unitOfMeasure, taxPercent: prod.taxRate || 18 });
  };
  const addRow = () => setItems(prev => [...prev, blankItem()]);
  const removeRow = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supplierId) { setError('Please select a supplier'); return; }
    const validItems = items.filter(it => it.description.trim() && it.quantity > 0);
    if (validItems.length === 0) { setError('Add at least one valid line item'); return; }
    setSaving(true);
    try {
      await api.createPurchaseBill({ supplierId, supplierInvoiceNumber, billDate, dueDate, items: validItems });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2"><ShoppingBag className="w-4.5 h-4.5 text-[#00288e]" /><span>Create Purchase Bill</span></h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier *</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="">Select supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier Invoice Number</label>
              <input value={supplierInvoiceNumber} onChange={e => setSupplierInvoiceNumber(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bill Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="py-2 px-2 text-left w-1/3">Item / Description</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Rate</th>
                  <th className="py-2 px-2 text-right">Tax %</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(it => {
                  const base = it.quantity * it.rate;
                  const amount = base + base * (it.taxPercent / 100);
                  return (
                    <tr key={it.id}>
                      <td className="py-1.5 px-2">
                        <select onChange={e => e.target.value && applyProduct(it.id, e.target.value)} className="w-full mb-1 text-[11px] px-1.5 py-1 bg-gray-50 border border-gray-200 rounded" defaultValue="">
                          <option value="">+ Pick from inventory (optional)</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input value={it.description} onChange={e => updateItem(it.id, { description: e.target.value })} placeholder="Item description" className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs" />
                      </td>
                      <td className="py-1.5 px-2"><input type="number" min="0" value={it.quantity} onChange={e => updateItem(it.id, { quantity: Number(e.target.value) })} className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
                      <td className="py-1.5 px-2"><input type="number" min="0" value={it.rate} onChange={e => updateItem(it.id, { rate: Number(e.target.value) })} className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
                      <td className="py-1.5 px-2"><input type="number" min="0" max="28" value={it.taxPercent} onChange={e => updateItem(it.id, { taxPercent: Number(e.target.value) })} className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
                      <td className="py-1.5 px-2 text-right font-bold text-gray-900 whitespace-nowrap">{formatINR(amount)}</td>
                      <td className="py-1.5 px-1"><button type="button" onClick={() => removeRow(it.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button type="button" onClick={addRow} className="w-full py-2 text-xs font-semibold text-[#00288e] hover:bg-blue-50 flex items-center justify-center space-x-1.5 border-t border-gray-100">
              <Plus className="w-3.5 h-3.5" /><span>Add Line Item</span>
            </button>
          </div>
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax (GST)</span><span>+ {formatINR(totals.totalTax)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-sm pt-1.5 border-t border-gray-200"><span>Grand Total</span><span>{formatINR(totals.grandTotal)}</span></div>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Saving...' : 'Save Purchase Bill'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaySupplierModal: React.FC<{ bill: PurchaseBill; onClose: () => void; onSuccess: () => void }> = ({ bill, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(String(bill.balanceDue));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    if (amt > bill.balanceDue) { setError(`Cannot exceed balance due (${formatINR(bill.balanceDue)})`); return; }
    setSaving(true);
    try {
      await api.payPurchaseBill(bill.id, amt);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div><h2 className="text-base font-bold text-gray-900">Pay Supplier</h2><p className="text-xs text-gray-500">{bill.billNumber} — {bill.supplierName}</p></div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg p-3 border border-gray-100">
            <span className="text-gray-500">Balance Due</span><span className="font-bold text-red-600">{formatINR(bill.balanceDue)}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Amount to Pay (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Recording...' : 'Record Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
