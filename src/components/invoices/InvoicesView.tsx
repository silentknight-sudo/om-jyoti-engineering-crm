import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Plus, Search, X, Trash2, Printer, AlertCircle, ArrowLeft, IndianRupee, Ban
} from 'lucide-react';
import { api } from '../../services/api';
import { Party, Product, Quotation, Invoice, InvoiceLineItem, InvoiceStatus, PaymentIn, PaymentMode } from '../../types';

const formatINR = (val: number) => '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  unpaid: 'bg-amber-100 text-amber-800',
  partially_paid: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-600'
};

export const InvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoices({ status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined });
      setInvoices(res.invoices);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [search, statusFilter]);

  const cancelInvoice = async (id: string) => {
    if (!confirm('Cancel this invoice? This cannot be undone.')) return;
    try {
      await api.updateInvoiceStatus(id, 'cancelled');
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice');
    }
  };

  if (printingInvoice) {
    return <InvoicePrintView invoice={printingInvoice} onBack={() => setPrintingInvoice(null)} />;
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sales Invoices</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create GST-ready sales invoices, track balances, and record customer payments against them.
          </p>
        </div>
        <button
          onClick={() => setBuilderOpen(true)}
          className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Sales Invoice</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-full sm:w-auto">
          <option value="all">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date / Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total / Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading && <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading invoices...</td></tr>}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No sales invoices yet. Create your first invoice.</td></tr>
              )}
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-800">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{inv.partyName}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(inv.invoiceDate)} <span className="text-gray-300">/</span> {fmtDate(inv.dueDate)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLES[inv.status]}`}>{inv.status.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-gray-900">{formatINR(inv.grandTotal)}</span>
                    {inv.balanceDue > 0 && inv.status !== 'cancelled' && (
                      <span className="block text-[10px] text-red-600 font-semibold">Due: {formatINR(inv.balanceDue)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button onClick={() => setPrintingInvoice(inv)} className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                      <Printer className="w-3 h-3" /><span>Print</span>
                    </button>
                    {inv.balanceDue > 0 && inv.status !== 'cancelled' && (
                      <button onClick={() => setPaymentInvoice(inv)} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                        <IndianRupee className="w-3 h-3" /><span>Payment In</span>
                      </button>
                    )}
                    {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                      <button onClick={() => cancelInvoice(inv.id)} className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                        <Ban className="w-3 h-3" /><span>Cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {builderOpen && (
        <InvoiceBuilderModal onClose={() => setBuilderOpen(false)} onSuccess={() => { setBuilderOpen(false); fetchInvoices(); }} />
      )}

      {paymentInvoice && (
        <RecordPaymentModal invoice={paymentInvoice} onClose={() => setPaymentInvoice(null)} onSuccess={() => { setPaymentInvoice(null); fetchInvoices(); }} />
      )}
    </div>
  );
};

let lineItemSeq = 0;
const blankLineItem = (): InvoiceLineItem => ({
  id: 'tmp-' + (++lineItemSeq),
  description: '',
  quantity: 1,
  unit: 'Unit',
  rate: 0,
  discountPercent: 0,
  taxPercent: 18,
  amount: 0
});

const InvoiceBuilderModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [acceptedQuotations, setAcceptedQuotations] = useState<Quotation[]>([]);
  const [partyId, setPartyId] = useState('');
  const [quotationId, setQuotationId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
  const [items, setItems] = useState<InvoiceLineItem[]>([blankLineItem()]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getParties({ partyType: 'customer' }).then(res => setParties(res.parties)).catch(() => {});
    api.getProducts({}).then(res => setProducts(res.products)).catch(() => {});
    api.getQuotations({ status: 'accepted' }).then(res => setAcceptedQuotations(res.quotations)).catch(() => {});
  }, []);

  const applyQuotation = (qId: string) => {
    setQuotationId(qId);
    const q = acceptedQuotations.find(x => x.id === qId);
    if (!q) return;
    setPartyId(q.partyId);
    setItems(q.items.map(it => ({ ...it, id: 'tmp-' + (++lineItemSeq) })));
  };

  const totals = useMemo(() => {
    let subtotal = 0, totalDiscount = 0, totalTax = 0;
    items.forEach(it => {
      const base = it.quantity * it.rate;
      const disc = base * (it.discountPercent / 100);
      const taxable = base - disc;
      const tax = taxable * (it.taxPercent / 100);
      subtotal += base;
      totalDiscount += disc;
      totalTax += tax;
    });
    return { subtotal, totalDiscount, totalTax, grandTotal: subtotal - totalDiscount + totalTax };
  }, [items]);

  const updateItem = (id: string, patch: Partial<InvoiceLineItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };

  const applyProduct = (id: string, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    updateItem(id, { productId: prod.id, description: prod.name, rate: prod.sellingPrice, unit: prod.unitOfMeasure, taxPercent: prod.taxRate || 18 });
  };

  const addRow = () => setItems(prev => [...prev, blankLineItem()]);
  const removeRow = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!partyId) { setError('Please select a customer'); return; }
    const validItems = items.filter(it => it.description.trim() && it.quantity > 0);
    if (validItems.length === 0) { setError('Add at least one valid line item'); return; }
    setSaving(true);
    try {
      await api.createInvoice({ partyId, invoiceDate, dueDate, items: validItems, notes, quotationId: quotationId || undefined });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2"><Receipt className="w-4.5 h-4.5 text-[#00288e]" /><span>Create Sales Invoice</span></h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          {acceptedQuotations.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Convert from Accepted Quotation (optional)</label>
              <select value={quotationId} onChange={e => e.target.value ? applyQuotation(e.target.value) : setQuotationId('')} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="">Start blank invoice</option>
                {acceptedQuotations.map(q => <option key={q.id} value={q.id}>{q.quotationNumber} — {q.partyName} ({formatINR(q.grandTotal)})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer *</label>
              <select value={partyId} onChange={e => setPartyId(e.target.value)} disabled={!!quotationId} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-60">
                <option value="">Select customer...</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.partyIdNumber})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
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
                  <th className="py-2 px-2 text-right">Disc %</th>
                  <th className="py-2 px-2 text-right">Tax %</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(it => {
                  const base = it.quantity * it.rate;
                  const disc = base * (it.discountPercent / 100);
                  const taxable = base - disc;
                  const tax = taxable * (it.taxPercent / 100);
                  const amount = taxable + tax;
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
                      <td className="py-1.5 px-2"><input type="number" min="0" max="100" value={it.discountPercent} onChange={e => updateItem(it.id, { discountPercent: Number(e.target.value) })} className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
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
              <div className="flex justify-between text-gray-600"><span>Discount</span><span>- {formatINR(totals.totalDiscount)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax (GST)</span><span>+ {formatINR(totals.totalTax)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-sm pt-1.5 border-t border-gray-200"><span>Grand Total</span><span>{formatINR(totals.grandTotal)}</span></div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecordPaymentModal: React.FC<{ invoice: Invoice; onClose: () => void; onSuccess: () => void }> = ({ invoice, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(String(invoice.balanceDue));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Enter a valid payment amount'); return; }
    if (amt > invoice.balanceDue) { setError(`Amount cannot exceed balance due (${formatINR(invoice.balanceDue)})`); return; }
    setSaving(true);
    try {
      await api.createPayment({ partyId: invoice.partyId, invoiceId: invoice.id, amount: amt, paymentMode, referenceNumber, paymentDate, notes });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900">Record Payment In</h2>
            <p className="text-xs text-gray-500">{invoice.invoiceNumber} — {invoice.partyName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg p-3 border border-gray-100">
            <span className="text-gray-500">Balance Due</span>
            <span className="font-bold text-red-600">{formatINR(invoice.balanceDue)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Amount Received (₹) *</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date</label>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reference / UTR / Cheque No.</label>
              <input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-60">
              {saving ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InvoicePrintView: React.FC<{ invoice: Invoice; onBack: () => void }> = ({ invoice: inv, onBack }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-100">
      <div className="max-w-3xl mx-auto py-6 print:py-0">
        <div className="flex items-center justify-between mb-4 px-2 print:hidden">
          <button onClick={onBack} className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-3.5 h-3.5" /><span>Back to Invoices</span>
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5">
            <Printer className="w-3.5 h-3.5" /><span>Print / Save as PDF</span>
          </button>
        </div>

        <div className="bg-white p-10 shadow-md print:shadow-none rounded-xl print:rounded-none text-sm text-gray-800">
          <div className="flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-xl font-bold text-[#00288e]">M/S OM JYOTI ENGINEERING</h1>
              <p className="text-xs text-gray-500 mt-1">Industrial STP, ETP, RO & Water Treatment Solutions</p>
              <p className="text-xs text-gray-500">Plot No. 44, Sector 63, Noida, Uttar Pradesh - 201301</p>
              <p className="text-xs text-gray-500">Phone: +91 120 456 7890 | contact@omjyotiengg.com</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900 uppercase">Tax Invoice</h2>
              <p className="text-xs text-gray-500 mt-1">{inv.invoiceNumber}</p>
              <p className="text-xs text-gray-500">Date: {fmtDate(inv.invoiceDate)}</p>
              <p className="text-xs text-gray-500">Due: {fmtDate(inv.dueDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Bill To</p>
              <p className="font-bold text-gray-900">{inv.partyName}</p>
              {inv.partyAddress && <p className="text-xs text-gray-600">{inv.partyAddress}</p>}
              {inv.partyPhone && <p className="text-xs text-gray-600">Phone: {inv.partyPhone}</p>}
              {inv.partyGstin && <p className="text-xs text-gray-600">GSTIN: {inv.partyGstin}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
              <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold uppercase ${STATUS_STYLES[inv.status]}`}>{inv.status.replace('_', ' ')}</span>
            </div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                <th className="py-2 px-2 text-left">#</th>
                <th className="py-2 px-2 text-left">Description</th>
                <th className="py-2 px-2 text-right">Qty</th>
                <th className="py-2 px-2 text-right">Rate</th>
                <th className="py-2 px-2 text-right">Disc%</th>
                <th className="py-2 px-2 text-right">Tax%</th>
                <th className="py-2 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inv.items.map((it, idx) => (
                <tr key={it.id}>
                  <td className="py-2 px-2">{idx + 1}</td>
                  <td className="py-2 px-2">{it.description}</td>
                  <td className="py-2 px-2 text-right">{it.quantity} {it.unit}</td>
                  <td className="py-2 px-2 text-right">{formatINR(it.rate)}</td>
                  <td className="py-2 px-2 text-right">{it.discountPercent}%</td>
                  <td className="py-2 px-2 text-right">{it.taxPercent}%</td>
                  <td className="py-2 px-2 text-right font-semibold">{formatINR(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatINR(inv.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Discount</span><span>- {formatINR(inv.totalDiscount)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax (GST)</span><span>+ {formatINR(inv.totalTax)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1.5 border-t border-gray-300"><span>Grand Total</span><span>{formatINR(inv.grandTotal)}</span></div>
              <div className="flex justify-between text-emerald-700"><span>Amount Paid</span><span>{formatINR(inv.amountPaid)}</span></div>
              <div className="flex justify-between font-bold text-red-600"><span>Balance Due</span><span>{formatINR(inv.balanceDue)}</span></div>
            </div>
          </div>

          {inv.notes && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">{inv.notes}</p>
            </div>
          )}

          {inv.termsAndConditions && (
            <div className="mt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Terms & Conditions</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">{inv.termsAndConditions}</p>
            </div>
          )}

          <div className="mt-10 flex justify-end">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-8">For M/S OM JYOTI ENGINEERING</p>
              <p className="text-xs font-semibold text-gray-800 border-t border-gray-400 pt-1">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
