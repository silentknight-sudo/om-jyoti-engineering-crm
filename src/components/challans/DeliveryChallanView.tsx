import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, X, Trash2, Printer, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Party, Product, DeliveryChallan, DeliveryChallanItem, DeliveryChallanStatus } from '../../types';

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const STATUS_STYLES: Record<DeliveryChallanStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  converted: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-gray-200 text-gray-600'
};

export const DeliveryChallanView: React.FC = () => {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [printing, setPrinting] = useState<DeliveryChallan | null>(null);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.getDeliveryChallans({ search: search || undefined });
      setChallans(res.deliveryChallans);
    } catch (err) {
      console.error('Failed to load delivery challans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallans(); }, [search]);

  const markDelivered = async (id: string) => {
    try {
      await api.updateDeliveryChallanStatus(id, 'delivered');
      fetchChallans();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  if (printing) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-100">
        <div className="max-w-3xl mx-auto py-6 print:py-0">
          <div className="flex items-center justify-between mb-4 px-2 print:hidden">
            <button onClick={() => setPrinting(null)} className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-3.5 h-3.5" /><span>Back</span>
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5">
              <Printer className="w-3.5 h-3.5" /><span>Print</span>
            </button>
          </div>
          <div className="bg-white p-10 shadow-md print:shadow-none rounded-xl print:rounded-none text-sm text-gray-800">
            <div className="flex items-start justify-between border-b border-gray-200 pb-6">
              <div>
                <h1 className="text-xl font-bold text-[#00288e]">M/S OM JYOTI ENGINEERING</h1>
                <p className="text-xs text-gray-500 mt-1">Plot No. 44, Sector 63, Noida, Uttar Pradesh - 201301</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-gray-900 uppercase">Delivery Challan</h2>
                <p className="text-xs text-gray-500 mt-1">{printing.challanNumber}</p>
                <p className="text-xs text-gray-500">Date: {fmtDate(printing.challanDate)}</p>
              </div>
            </div>
            <div className="py-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Deliver To</p>
              <p className="font-bold text-gray-900">{printing.partyName}</p>
              {printing.partyAddress && <p className="text-xs text-gray-600">{printing.partyAddress}</p>}
              {printing.vehicleNumber && <p className="text-xs text-gray-600 mt-1">Vehicle: {printing.vehicleNumber} • Mode: {printing.transportMode}</p>}
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                  <th className="py-2 px-2 text-left">#</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {printing.items.map((it, idx) => (
                  <tr key={it.id}>
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2">{it.description}</td>
                    <td className="py-2 px-2 text-right">{it.quantity} {it.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-10 flex justify-between">
              <div className="text-center"><p className="text-xs font-semibold text-gray-800 border-t border-gray-400 pt-1 px-6">Receiver Signature</p></div>
              <div className="text-center"><p className="text-xs font-semibold text-gray-800 border-t border-gray-400 pt-1 px-6">Authorized Signatory</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Delivery Challan</h1>
          <p className="text-xs text-gray-500 mt-0.5">Dispatch equipment/spares to customer sites and track delivery without invoicing.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5">
          <Plus className="w-3.5 h-3.5" /><span>+ Create Challan</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by challan number or customer..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold">
            <tr>
              <th className="py-2.5 px-4">Challan #</th>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Items</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading...</td></tr>}
            {!loading && challans.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">No delivery challans yet.</td></tr>}
            {challans.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono font-bold text-gray-800">{c.challanNumber}</td>
                <td className="py-2.5 px-4 font-semibold text-gray-900">{c.partyName}</td>
                <td className="py-2.5 px-4 text-gray-500">{fmtDate(c.challanDate)}</td>
                <td className="py-2.5 px-4 text-gray-600">{c.items.length} item(s)</td>
                <td className="py-2.5 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLES[c.status]}`}>{c.status}</span></td>
                <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-1.5">
                  <button onClick={() => setPrinting(c)} className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                    <Printer className="w-3 h-3" /><span>Print</span>
                  </button>
                  {c.status === 'pending' && (
                    <button onClick={() => markDelivered(c.id)} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" /><span>Mark Delivered</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && <CreateChallanModal onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchChallans(); }} />}
    </div>
  );
};

let seq = 0;
const blankItem = (): DeliveryChallanItem => ({ id: 'tmp-' + (++seq), description: '', quantity: 1, unit: 'Unit' });

const CreateChallanModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partyId, setPartyId] = useState('');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [items, setItems] = useState<DeliveryChallanItem[]>([blankItem()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getParties({ partyType: 'customer' }).then(res => setParties(res.parties)).catch(() => {});
    api.getProducts({}).then(res => setProducts(res.products)).catch(() => {});
  }, []);

  const updateItem = (id: string, patch: Partial<DeliveryChallanItem>) => setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  const applyProduct = (id: string, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) updateItem(id, { productId: prod.id, description: prod.name, unit: prod.unitOfMeasure });
  };
  const addRow = () => setItems(prev => [...prev, blankItem()]);
  const removeRow = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!partyId) { setError('Please select a customer'); return; }
    const validItems = items.filter(it => it.description.trim() && it.quantity > 0);
    if (validItems.length === 0) { setError('Add at least one valid item'); return; }
    setSaving(true);
    try {
      await api.createDeliveryChallan({ partyId, challanDate, vehicleNumber, items: validItems });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create challan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2"><Truck className="w-4.5 h-4.5 text-[#00288e]" /><span>Create Delivery Challan</span></h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer *</label>
              <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="">Select customer...</option>
                {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
              <input type="date" value={challanDate} onChange={e => setChallanDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vehicle Number</label>
              <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="e.g. UP16 AB 1234" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr><th className="py-2 px-2 text-left">Item</th><th className="py-2 px-2 text-right w-24">Qty</th><th className="py-2 px-2 text-right w-24">Unit</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(it => (
                  <tr key={it.id}>
                    <td className="py-1.5 px-2">
                      <select onChange={e => e.target.value && applyProduct(it.id, e.target.value)} className="w-full mb-1 text-[11px] px-1.5 py-1 bg-gray-50 border border-gray-200 rounded" defaultValue="">
                        <option value="">+ Pick from inventory (optional)</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input value={it.description} onChange={e => updateItem(it.id, { description: e.target.value })} placeholder="Item description" className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs" />
                    </td>
                    <td className="py-1.5 px-2"><input type="number" min="0" value={it.quantity} onChange={e => updateItem(it.id, { quantity: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
                    <td className="py-1.5 px-2"><input value={it.unit} onChange={e => updateItem(it.id, { unit: e.target.value })} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
                    <td className="py-1.5 px-1"><button type="button" onClick={() => removeRow(it.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={addRow} className="w-full py-2 text-xs font-semibold text-[#00288e] hover:bg-blue-50 flex items-center justify-center space-x-1.5 border-t border-gray-100">
              <Plus className="w-3.5 h-3.5" /><span>Add Item</span>
            </button>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Saving...' : 'Save Challan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
