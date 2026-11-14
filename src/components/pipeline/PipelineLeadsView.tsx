import React, { useState, useEffect } from 'react';
import { Plus, Search, X, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DIVISIONS, Division, PipelineLeadType, NEW_SALES_STAGES, SERVICE_STAGES, LeadSource } from '../../types';
import { PipelineLeadDetailView } from './PipelineLeadDetailView';

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function ageingHours(stageEnteredAt: string): number {
  return (Date.now() - new Date(stageEnteredAt).getTime()) / 3600000;
}

function ageingLabel(stageEnteredAt: string): string {
  const hrs = ageingHours(stageEnteredAt);
  if (hrs < 24) return `${Math.round(hrs)}h`;
  return `${Math.round(hrs / 24)}d`;
}

const AGEING_FLAG_HOURS = 72; // configurable in future; flags leads stuck > 3 days in a stage

export const PipelineLeadsView: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | PipelineLeadType>('all');
  const [divisionFilter, setDivisionFilter] = useState<'all' | Division>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.getPipelineLeads({
        leadType: typeFilter !== 'all' ? typeFilter : undefined,
        division: divisionFilter !== 'all' ? divisionFilter : undefined,
        search: search || undefined
      });
      setLeads(res.leads);
    } catch (err) {
      console.error('Failed to load pipeline leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [search, typeFilter, divisionFilter]);

  const stageLabel = (lead: any) => {
    const list = lead.leadType === 'service' ? SERVICE_STAGES : NEW_SALES_STAGES;
    return list.find(s => s.id === lead.stage)?.label || lead.stage;
  };

  if (selectedLeadId) {
    return <PipelineLeadDetailView leadId={selectedLeadId} onBack={() => { setSelectedLeadId(null); fetchLeads(); }} />;
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sales & Service Pipeline</h1>
          <p className="text-xs text-gray-500 mt-0.5">New Sales (project) and Service Sales (repair/AMC/warranty) lanes — lead to order to execution.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5">
          <Plus className="w-3.5 h-3.5" /><span>+ New Lead</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, lead number, phone, company..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-full sm:w-auto">
          <option value="all">New Sales + Service</option>
          <option value="new_sales">New Sales</option>
          <option value="service">Service Sales</option>
        </select>
        <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value as any)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-full sm:w-auto">
          <option value="all">All Divisions</option>
          {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-4">Lead</th>
              <th className="py-2.5 px-4">Division / Type</th>
              <th className="py-2.5 px-4">Stage</th>
              <th className="py-2.5 px-4">Last Remark</th>
              <th className="py-2.5 px-4">Next Action</th>
              <th className="py-2.5 px-4">Ageing</th>
              <th className="py-2.5 px-4">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>}
            {!loading && leads.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-400">No leads yet. Create your first lead.</td></tr>}
            {leads.map(l => {
              const flagged = ageingHours(l.stageEnteredAt) > AGEING_FLAG_HOURS;
              return (
                <tr key={l.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLeadId(l.id)}>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{l.leadNumber}</span>
                    <p className="font-bold text-gray-900 mt-1">{l.customerName}</p>
                    <p className="text-[11px] text-gray-500">{l.companyName} {l.phone}</p>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-medium text-[11px]">{l.division}</span>
                    <span className="block text-[10px] text-gray-400 uppercase mt-1">{l.leadType === 'service' ? 'Service' : 'New Sales'}</span>
                  </td>
                  <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-semibold text-gray-700">{stageLabel(l)}</span></td>
                  <td className="py-2.5 px-4 text-gray-600 max-w-[180px] truncate">{l.lastRemark || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-600">{l.nextAction ? <><span>{l.nextAction}</span><span className="block text-[10px] text-gray-400">{fmtDate(l.nextActionDate)}</span></> : '—'}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center space-x-1 font-semibold ${flagged ? 'text-red-600' : 'text-gray-600'}`}>
                      {flagged && <AlertTriangle className="w-3 h-3" />}<Clock className="w-3 h-3" /><span>{ageingLabel(l.stageEnteredAt)}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-700">{l.ownerName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {createOpen && <CreateLeadModal onClose={() => setCreateOpen(false)} onSuccess={(id) => { setCreateOpen(false); fetchLeads(); setSelectedLeadId(id); }} />}
    </div>
  );
};

const CreateLeadModal: React.FC<{ onClose: () => void; onSuccess: (leadId: string) => void }> = ({ onClose, onSuccess }) => {
  const [leadType, setLeadType] = useState<PipelineLeadType>('new_sales');
  const [division, setDivision] = useState<Division>('STP');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [source, setSource] = useState<LeadSource>('referral');
  const [amcType, setAmcType] = useState('none');
  const [amcStatus, setAmcStatus] = useState('none');
  const [warrantyStatus, setWarrantyStatus] = useState('none');
  const [outOfAmcOrWarranty, setOutOfAmcOrWarranty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerName.trim() || !phone.trim()) { setError('Customer name and phone are required'); return; }
    setSaving(true);
    try {
      const res = await api.createPipelineLead({ leadType, division, customerName, phone, companyName, email, address, source, amcType, amcStatus, warrantyStatus, outOfAmcOrWarranty });
      onSuccess(res.lead.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-base font-bold text-gray-900">New Lead</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Type *</label>
              <select value={leadType} onChange={e => setLeadType(e.target.value as PipelineLeadType)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="new_sales">New Sales (Project)</option>
                <option value="service">Service Sales (Repair/AMC/Warranty)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Division *</label>
              <select value={division} onChange={e => setDivision(e.target.value as Division)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name *</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
            <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
            <select value={source} onChange={e => setSource(e.target.value as LeadSource)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
              <option value="website">Website</option>
              <option value="cold_call">Cold Call</option>
              <option value="referral">Referral</option>
              <option value="event">Event</option>
              <option value="email">Email</option>
              <option value="social_media">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          {leadType === 'service' && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase">AMC / Warranty (FR-S1)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">AMC/CMC Status</label>
                  <select value={amcStatus} onChange={e => setAmcStatus(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                    <option value="none">None</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Warranty Status</label>
                  <select value={warrantyStatus} onChange={e => setWarrantyStatus(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                    <option value="none">None</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">AMC Type</label>
                <select value={amcType} onChange={e => setAmcType(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                  <option value="none">None</option>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="spares_only">Spares Only</option>
                  <option value="labour_only">Labour Only</option>
                </select>
              </div>
              <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={outOfAmcOrWarranty} onChange={e => setOutOfAmcOrWarranty(e.target.checked)} className="rounded" />
                <span>Out of AMC / out of warranty (everything payable)</span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Creating...' : 'Create Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
