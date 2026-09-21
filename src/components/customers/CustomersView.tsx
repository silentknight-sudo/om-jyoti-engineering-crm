import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, X, Phone, Mail, MapPin, Droplets, Wrench,
  Calendar, ShieldCheck, AlertCircle, ArrowLeft, FileText, Trash2, Edit3
} from 'lucide-react';
import { api } from '../../services/api';
import { Party, CustomerEquipment, ServiceJob, Quotation, EquipmentCategory } from '../../types';

const formatINR = (val: number) => '₹' + Number(val || 0).toLocaleString('en-IN');
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export const CustomersView: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const res = await api.getParties({ partyType: 'customer', search: search || undefined });
      setParties(res.parties);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParties(); }, [search]);

  if (selectedId) {
    return <CustomerDetailsView partyId={selectedId} onBack={() => { setSelectedId(null); fetchParties(); }} />;
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage water treatment equipment customers, their installed plants, AMC status, and service history.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Customer</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
          />
        </div>
        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">{parties.length} Customers</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Loading customers...</td></tr>
              )}
              {!loading && parties.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">No customers yet. Add your first customer to get started.</td></tr>
              )}
              {parties.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors cursor-pointer" onClick={() => setSelectedId(p.id)}>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{p.partyIdNumber}</span>
                    <p className="font-bold text-gray-900 mt-1">{p.name}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    <div className="flex items-center space-x-1.5"><Phone className="w-3 h-3 text-gray-400" /><span>{p.phone}</span></div>
                    {p.email && <div className="flex items-center space-x-1.5 mt-0.5 text-gray-500"><Mail className="w-3 h-3 text-gray-400" /><span>{p.email}</span></div>}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.city || '—'}{p.state ? `, ${p.state}` : ''}</td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${p.balanceType === 'to_collect' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatINR(p.openingBalance)}
                    </span>
                    <span className="block text-[10px] text-gray-400 uppercase">{p.balanceType === 'to_collect' ? 'To Collect' : 'To Pay'}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] rounded-lg text-xs font-semibold">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <AddPartyModal
          partyType="customer"
          onClose={() => setAddOpen(false)}
          onSuccess={() => { setAddOpen(false); fetchParties(); }}
        />
      )}
    </div>
  );
};

export const AddPartyModal: React.FC<{ partyType: 'customer' | 'supplier'; onClose: () => void; onSuccess: () => void }> = ({ partyType, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [balanceType, setBalanceType] = useState<'to_collect' | 'to_pay'>('to_collect');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Name and mobile number are required');
      return;
    }
    setSaving(true);
    try {
      await api.createParty({
        partyType, name, phone, email, gstin, billingAddress, city, state,
        openingBalance: Number(openingBalance) || 0, balanceType
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-base font-bold text-gray-900">Add {partyType === 'customer' ? 'Customer' : 'Supplier'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" placeholder="Company / Individual name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" placeholder="9876543210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" placeholder="name@company.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN</label>
              <input value={gstin} onChange={e => setGstin(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono" placeholder="29XXXXX9438XX" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Address</label>
            <textarea rows={2} value={billingAddress} onChange={e => setBillingAddress(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
              <input value={state} onChange={e => setState(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Opening Balance (₹)</label>
              <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Balance Type</label>
              <select value={balanceType} onChange={e => setBalanceType(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="to_collect">To Collect</option>
                <option value="to_pay">To Pay</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : `Save ${partyType === 'customer' ? 'Customer' : 'Supplier'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerDetailsView: React.FC<{ partyId: string; onBack: () => void }> = ({ partyId, onBack }) => {
  const [party, setParty] = useState<Party | null>(null);
  const [equipment, setEquipment] = useState<CustomerEquipment[]>([]);
  const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipModalOpen, setEquipModalOpen] = useState(false);
  const [tab, setTab] = useState<'equipment' | 'service' | 'quotations'>('equipment');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPartyById(partyId);
      setParty(res.party);
      setEquipment(res.equipment);
      setServiceJobs(res.serviceJobs);
      setQuotations(res.quotations);
    } catch (err) {
      console.error('Failed to load customer profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [partyId]);

  if (loading || !party) {
    return <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Loading customer profile...</div>;
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <button onClick={onBack} className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-3.5 h-3.5" /><span>Back to Customers</span>
      </button>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{party.partyIdNumber}</span>
          <h1 className="text-lg font-bold text-gray-900 mt-1">{party.name}</h1>
          <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-gray-600">
            <span className="flex items-center space-x-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /><span>{party.phone}</span></span>
            {party.email && <span className="flex items-center space-x-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /><span>{party.email}</span></span>}
            {party.city && <span className="flex items-center space-x-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span>{party.city}, {party.state}</span></span>}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl font-bold ${party.balanceType === 'to_collect' ? 'text-emerald-700' : 'text-red-600'}`}>{formatINR(party.openingBalance)}</span>
          <span className="block text-[10px] text-gray-400 uppercase">{party.balanceType === 'to_collect' ? 'To Collect' : 'To Pay'}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        {[
          { id: 'equipment', label: 'Installed Equipment', count: equipment.length },
          { id: 'service', label: 'Service History', count: serviceJobs.length },
          { id: 'quotations', label: 'Quotations', count: quotations.length }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-2 ${tab === t.id ? 'bg-[#00288e] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <span>{t.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'equipment' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setEquipModalOpen(true)} className="px-3.5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5" /><span>Add Equipment</span>
            </button>
          </div>
          {equipment.length === 0 && <p className="text-center text-xs text-gray-400 py-8">No equipment recorded for this customer yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipment.map(eq => (
              <div key={eq.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#00288e] flex items-center justify-center"><Droplets className="w-4.5 h-4.5" /></div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{eq.equipmentName}</h3>
                      <p className="text-[11px] text-gray-500">{eq.category}{eq.capacity ? ` • ${eq.capacity}` : ''}</p>
                    </div>
                  </div>
                  {eq.amcActive && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" /><span>AMC Active</span>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-2 border-t border-gray-100">
                  <p>Make/Model: <strong className="text-gray-800">{eq.make || '—'} {eq.model || ''}</strong></p>
                  <p>Serial No: <strong className="text-gray-800">{eq.serialNumber || '—'}</strong></p>
                  <p>Installed: <strong className="text-gray-800">{fmtDate(eq.installationDate)}</strong></p>
                  <p>Last Service: <strong className="text-gray-800">{fmtDate(eq.lastServiceDate)}</strong></p>
                  <p className="col-span-2">Next Service Due: <strong className={`${eq.nextDueDate && new Date(eq.nextDueDate) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>{fmtDate(eq.nextDueDate)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'service' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          {serviceJobs.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">No service jobs recorded yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Job ID</th>
                  <th className="py-2.5 px-4">Equipment</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serviceJobs.map(j => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-gray-700">{j.jobIdNumber}</td>
                    <td className="py-2.5 px-4 text-gray-700">{j.equipmentName || '—'}</td>
                    <td className="py-2.5 px-4 capitalize text-gray-600">{j.jobType.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-4 text-gray-500">{fmtDate(j.scheduledDate)}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        j.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        j.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        j.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-800'
                      }`}>{j.status.replace('_', ' ')}</span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">{formatINR(j.chargeAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'quotations' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          {quotations.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">No quotations created for this customer yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Quotation #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotations.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-gray-700">{q.quotationNumber}</td>
                    <td className="py-2.5 px-4 text-gray-500">{fmtDate(q.quotationDate)}</td>
                    <td className="py-2.5 px-4 capitalize">{q.status}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900">{formatINR(q.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {equipModalOpen && (
        <AddEquipmentModal partyId={partyId} onClose={() => setEquipModalOpen(false)} onSuccess={() => { setEquipModalOpen(false); load(); }} />
      )}
    </div>
  );
};

const AddEquipmentModal: React.FC<{ partyId: string; onClose: () => void; onSuccess: () => void }> = ({ partyId, onClose, onSuccess }) => {
  const [equipmentName, setEquipmentName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('STP');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [amcActive, setAmcActive] = useState(false);
  const [serviceFrequencyDays, setServiceFrequencyDays] = useState('90');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!equipmentName.trim()) { setError('Equipment name is required'); return; }
    setSaving(true);
    try {
      await api.addEquipment(partyId, {
        equipmentName, category, make, model, capacity, serialNumber, installationDate,
        amcActive, serviceFrequencyDays: Number(serviceFrequencyDays) || 90
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save equipment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-base font-bold text-gray-900">Add Installed Equipment</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Name *</label>
              <input value={equipmentName} onChange={e => setEquipmentName(e.target.value)} placeholder="e.g. STP Plant - Block A" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as EquipmentCategory)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="STP">STP</option>
                <option value="ETP">ETP</option>
                <option value="RO Plant">RO Plant</option>
                <option value="WTP">WTP</option>
                <option value="Softener">Softener</option>
                <option value="Pump System">Pump System</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Make</label>
              <input value={make} onChange={e => setMake(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Model</label>
              <input value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity</label>
              <input value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 50 KLD" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Serial Number</label>
              <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Installation Date</label>
              <input type="date" value={installationDate} onChange={e => setInstallationDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Service Frequency (days)</label>
              <input type="number" value={serviceFrequencyDays} onChange={e => setServiceFrequencyDays(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
            <input type="checkbox" checked={amcActive} onChange={e => setAmcActive(e.target.checked)} className="rounded" />
            <span>Under Active AMC Contract</span>
          </label>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
