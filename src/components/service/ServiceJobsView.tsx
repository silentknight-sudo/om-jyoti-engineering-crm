import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Search, X, AlertCircle, CheckCircle2, Clock, PlayCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Party, CustomerEquipment, ServiceJob, ServiceJobStatus, ServiceJobType } from '../../types';

const formatINR = (val: number) => '₹' + Number(val || 0).toLocaleString('en-IN');
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const STATUS_STYLES: Record<ServiceJobStatus, string> = {
  scheduled: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-200 text-gray-600'
};

export const ServiceJobsView: React.FC = () => {
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getServiceJobs({ status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined });
      setJobs(res.serviceJobs);
    } catch (err) {
      console.error('Failed to load service jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [search, statusFilter]);

  const setJobStatus = async (job: ServiceJob, status: ServiceJobStatus) => {
    try {
      await api.updateServiceJob(job.id, {
        status,
        completedDate: status === 'completed' ? new Date().toISOString() : job.completedDate
      });
      fetchJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to update job');
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Service & AMC Jobs</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Schedule, track, and close out AMC visits, breakdown calls, and installation jobs for customer water treatment plants.
          </p>
        </div>
        <button
          onClick={() => setScheduleOpen(true)}
          className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Schedule Service Job</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by job ID, customer, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-full sm:w-auto">
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Customer / Equipment</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Scheduled</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Charge</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading service jobs...</td></tr>}
              {!loading && jobs.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">No service jobs scheduled yet.</td></tr>
              )}
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-800">{j.jobIdNumber}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-gray-900">{j.partyName}</p>
                    <p className="text-[11px] text-gray-500">{j.equipmentName || 'General visit'}</p>
                  </td>
                  <td className="py-3 px-4 capitalize text-gray-600">{j.jobType.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(j.scheduledDate)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLES[j.status]}`}>{j.status.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">{formatINR(j.chargeAmount)}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    {j.status === 'scheduled' && (
                      <button onClick={() => setJobStatus(j, 'in_progress')} className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                        <PlayCircle className="w-3 h-3" /><span>Start</span>
                      </button>
                    )}
                    {j.status !== 'completed' && j.status !== 'cancelled' && (
                      <button onClick={() => setJobStatus(j, 'completed')} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" /><span>Complete</span>
                      </button>
                    )}
                    {j.status === 'scheduled' && (
                      <button onClick={() => setJobStatus(j, 'cancelled')} className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1">
                        <XCircle className="w-3 h-3" /><span>Cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {scheduleOpen && (
        <ScheduleJobModal onClose={() => setScheduleOpen(false)} onSuccess={() => { setScheduleOpen(false); fetchJobs(); }} />
      )}
    </div>
  );
};

const ScheduleJobModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [equipment, setEquipment] = useState<CustomerEquipment[]>([]);
  const [partyId, setPartyId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [jobType, setJobType] = useState<ServiceJobType>('amc_routine');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [workDescription, setWorkDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getParties({ partyType: 'customer' }).then(res => setParties(res.parties)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!partyId) { setEquipment([]); return; }
    api.getPartyById(partyId).then(res => setEquipment(res.equipment)).catch(() => setEquipment([]));
  }, [partyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!partyId) { setError('Please select a customer'); return; }
    if (!workDescription.trim()) { setError('Work description is required'); return; }
    setSaving(true);
    try {
      await api.createServiceJob({ partyId, equipmentId: equipmentId || undefined, jobType, scheduledDate, workDescription, chargeAmount: Number(chargeAmount) || 0 });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule service job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2"><Wrench className="w-4.5 h-4.5 text-[#00288e]" /><span>Schedule Service Job</span></h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Customer *</label>
            <select value={partyId} onChange={e => { setPartyId(e.target.value); setEquipmentId(''); }} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
              <option value="">Select customer...</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.partyIdNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment (optional)</label>
            <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium" disabled={!partyId}>
              <option value="">General visit / not equipment-specific</option>
              {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.equipmentName} ({eq.category})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Job Type</label>
              <select value={jobType} onChange={e => setJobType(e.target.value as ServiceJobType)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
                <option value="amc_routine">AMC Routine Service</option>
                <option value="breakdown">Breakdown Call</option>
                <option value="installation">Installation</option>
                <option value="inspection">Inspection</option>
                <option value="chemical_dosing">Chemical Dosing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Date</label>
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Work Description *</label>
            <textarea rows={3} value={workDescription} onChange={e => setWorkDescription(e.target.value)} placeholder="e.g. Routine STP servicing, sludge check, aerator inspection..." className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Service Charge (₹)</label>
            <input type="number" value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : 'Schedule Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
