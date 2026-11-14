import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Check, Plus, X, AlertCircle, Upload, PhoneCall, Users2, FileText,
  TrendingUp, ClipboardCheck, PackageCheck, Wrench, ShieldCheck, Send
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  NEW_SALES_STAGES, SERVICE_STAGES, CallType, MeetingType, ActivityPhoto,
  PHOTO_REQUIRED_MEETING_TYPES, MANUFACTURING_STEPS
} from '../../types';
import { PhotoGpsCapture } from './PhotoGpsCapture';

const formatINR = (v: number) => '₹' + Number(v || 0).toLocaleString('en-IN');
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'requirement', label: 'Requirement Sheet', icon: ClipboardCheck },
  { id: 'followups', label: 'Follow-ups', icon: PhoneCall },
  { id: 'quotation', label: 'Quotation & Negotiation', icon: FileText },
  { id: 'order', label: 'Order', icon: PackageCheck },
  { id: 'execution', label: 'Execution', icon: Wrench }
];

export const PipelineLeadDetailView: React.FC<{ leadId: string; onBack: () => void }> = ({ leadId, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPipelineLeadById(leadId);
      setData(res);
    } catch (err) {
      console.error('Failed to load lead', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [leadId]);

  if (loading || !data) return <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Loading lead...</div>;

  const { lead } = data;
  const stages = lead.leadType === 'service' ? SERVICE_STAGES : NEW_SALES_STAGES;
  const currentIdx = stages.findIndex(s => s.id === lead.stage);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <button onClick={onBack} className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-3.5 h-3.5" /><span>Back to Pipeline</span>
      </button>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{lead.leadNumber}</span>
            <h1 className="text-lg font-bold text-gray-900 mt-1">{lead.customerName} {lead.companyName && <span className="text-gray-400 font-normal">· {lead.companyName}</span>}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{lead.phone} {lead.email && `· ${lead.email}`} · <span className="font-semibold text-blue-800">{lead.division}</span> · Owner: {lead.ownerName}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${lead.leadType === 'service' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
            {lead.leadType === 'service' ? 'Service Sales' : 'New Sales'}
          </span>
        </div>

        {/* Stage progress bar with ticks (FR-L6) */}
        <div className="pt-3 border-t border-gray-100 overflow-x-auto">
          <div className="flex items-center min-w-max">
            {stages.map((s, idx) => {
              const done = idx < currentIdx;
              const active = idx === currentIdx;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center shrink-0 w-28">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-emerald-600 text-white' : active ? 'bg-[#00288e] text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500'}`}>
                      {done ? <Check className="w-3 h-3" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] text-center mt-1 ${active ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{s.label}</span>
                  </div>
                  {idx < stages.length - 1 && <div className={`h-0.5 w-6 shrink-0 ${idx < currentIdx ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${tab === t.id ? 'bg-[#00288e] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-3.5 h-3.5" /><span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab data={data} onRefresh={load} />}
      {tab === 'requirement' && <RequirementSheetTab leadId={leadId} data={data} onRefresh={load} />}
      {tab === 'followups' && <FollowUpsTab leadId={leadId} data={data} onRefresh={load} />}
      {tab === 'quotation' && <QuotationNegotiationTab leadId={leadId} data={data} onRefresh={load} />}
      {tab === 'order' && <OrderTab leadId={leadId} data={data} onRefresh={load} />}
      {tab === 'execution' && <ExecutionTab leadId={leadId} data={data} onRefresh={load} />}
    </div>
  );
};

// ===================== OVERVIEW =====================

const OverviewTab: React.FC<{ data: any; onRefresh: () => void }> = ({ data }) => {
  const { lead, stageHistory } = data;
  return (
    <div className="space-y-4">
      {lead.leadType === 'service' && !['quotation', 'quotation_submitted', 'negotiation', 'service_order_punched', 'order_on_hold', 'order_approved', 'order_rejected', 'repair_execution', 'dispatch', 'closed'].includes(lead.stage) && (
        <ServiceAssessmentPanel data={data} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs p-5">
        <h3 className="font-bold text-sm text-gray-900 mb-3">Activity & Stage Log</h3>
        <div className="space-y-3">
          {stageHistory.length === 0 && <p className="text-xs text-gray-400">No stage changes yet.</p>}
          {[...stageHistory].reverse().map((s: any) => (
            <div key={s.id} className="flex items-start space-x-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-[#00288e] mt-1.5 shrink-0" />
              <div>
                <p className="text-gray-800"><strong>{s.toStage.replace(/_/g, ' ')}</strong>{s.fromStage ? <span className="text-gray-400"> ← {s.fromStage.replace(/_/g, ' ')}</span> : ''}</p>
                {s.note && <p className="text-gray-500">{s.note}</p>}
                <p className="text-[10px] text-gray-400">{fmtDateTime(s.changedAt)} · {s.changedByName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-3">
        <h3 className="font-bold text-sm text-gray-900">Lead Summary</h3>
        <div className="space-y-2 text-xs">
          <p className="flex justify-between"><span className="text-gray-500">Last Negotiated Price</span><strong>{lead.lastNegotiatedPrice ? formatINR(lead.lastNegotiatedPrice) : '—'}</strong></p>
          <p className="flex justify-between"><span className="text-gray-500">Next Action</span><strong className="text-right">{lead.nextAction || '—'}</strong></p>
          <p className="flex justify-between"><span className="text-gray-500">Next Action Date</span><strong>{fmtDate(lead.nextActionDate)}</strong></p>
          {lead.leadType === 'service' && (
            <>
              <p className="flex justify-between"><span className="text-gray-500">AMC Status</span><strong className="capitalize">{lead.amcStatus}</strong></p>
              <p className="flex justify-between"><span className="text-gray-500">Warranty Status</span><strong className="capitalize">{lead.warrantyStatus}</strong></p>
              <p className="flex justify-between"><span className="text-gray-500">Technician</span><strong>{lead.assignedTechnicianName || 'Not assigned'}</strong></p>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

const SERVICE_EQUIPMENT_CATEGORIES = ['Pumps', 'Motors', 'Compressors', 'High-Pressure Equipment'];

const ServiceAssessmentPanel: React.FC<{ data: any }> = ({ data }) => {
  const { lead, componentAssessments, faultAssessments } = data;
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [technicianId, setTechnicianId] = useState('');
  const [assessmentLocation, setAssessmentLocation] = useState<'factory' | 'site'>('factory');
  const [equipmentCategory, setEquipmentCategory] = useState(SERVICE_EQUIPMENT_CATEGORIES[0]);
  const [componentPhotos, setComponentPhotos] = useState<string[]>([]);
  const [conditionNotes, setConditionNotes] = useState('');
  const [faultPhoto, setFaultPhoto] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.getEmployees({}).then(res => setTechnicians(res.employees)).catch(() => {}); }, []);

  const assignTechnician = async () => {
    if (!technicianId) return;
    setBusy(true);
    try { await api.assignTechnician(lead.id, technicianId, assessmentLocation); window.location.reload(); } finally { setBusy(false); }
  };

  const addComponentPhotos = async (files: FileList) => {
    const urls = await Promise.all(Array.from(files).map(readFileAsDataUrl));
    setComponentPhotos(prev => [...prev, ...urls]);
  };

  const saveComponentAssessment = async () => {
    if (componentPhotos.length < 3) { alert('At least 3 photos are required'); return; }
    setBusy(true);
    try { await api.saveComponentAssessment(lead.id, { equipmentCategory, photoUrls: componentPhotos, conditionNotes }); window.location.reload(); } finally { setBusy(false); }
  };

  const uploadFaultList = async (file: File) => {
    const url = await readFileAsDataUrl(file);
    setFaultPhoto(url);
    setBusy(true);
    try { await api.saveFaultAssessment(lead.id, url); window.location.reload(); } finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-5">
      <h3 className="font-bold text-sm text-gray-900">Service Assessment</h3>

      {!lead.assignedTechnicianId && (
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Technician</label>
            <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
              <option value="">Select employee...</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
            <select value={assessmentLocation} onChange={e => setAssessmentLocation(e.target.value as any)} className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
              <option value="factory">Factory</option>
              <option value="site">Site</option>
            </select>
          </div>
          <button onClick={assignTechnician} disabled={busy} className="px-3 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">Assign</button>
        </div>
      )}

      {lead.assignedTechnicianId && componentAssessments.length === 0 && (
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600">Technician: <strong>{lead.assignedTechnicianName}</strong> ({lead.assessmentLocation})</p>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Component Assessment — Equipment Category</label>
          <select value={equipmentCategory} onChange={e => setEquipmentCategory(e.target.value)} className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
            {SERVICE_EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center space-x-1.5 flex-wrap gap-1.5">
            {componentPhotos.map((p, i) => <img key={i} src={p} className="w-14 h-14 rounded object-cover border border-gray-200" />)}
            <label className="w-14 h-14 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer text-[9px] text-center">
              +<input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files?.length) addComponentPhotos(e.target.files); }} />
            </label>
          </div>
          <textarea rows={2} value={conditionNotes} onChange={e => setConditionNotes(e.target.value)} placeholder="Condition notes (e.g. missing parts)" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          <button onClick={saveComponentAssessment} disabled={busy} className="px-4 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">Save Component Assessment ({componentPhotos.length}/3+ photos)</button>
        </div>
      )}

      {componentAssessments.length > 0 && faultAssessments.length === 0 && (
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <label className="block text-xs font-semibold text-gray-700">Fault Assessment — Upload photo of handwritten fault list</label>
          <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFaultList(f); }} className="text-xs" />
        </div>
      )}

      {faultAssessments.length > 0 && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">Fault list uploaded — proceed to generate quotation.</p>}
    </div>
  );
};

// ===================== REQUIREMENT SHEET =====================

const RequirementSheetTab: React.FC<{ leadId: string; data: any; onRefresh: () => void }> = ({ leadId, data, onRefresh }) => {
  const latest = data.requirementSheets[0];
  const [fields, setFields] = useState<[string, string][]>(latest ? Object.entries(latest.fields) : [['Equipment / Model', ''], ['Capacity', ''], ['Site Location', '']]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (idx: number, key: 'k' | 'v', value: string) => {
    setFields(prev => prev.map((f, i) => i === idx ? (key === 'k' ? [value, f[1]] : [f[0], value]) : f));
  };
  const addField = () => setFields(prev => [...prev, ['', '']]);
  const removeField = (idx: number) => setFields(prev => prev.filter((_, i) => i !== idx));
  const markNA = (idx: number) => updateField(idx, 'v', 'NA');

  const handleSave = async () => {
    setError(null);
    const obj: Record<string, string> = {};
    for (const [k, v] of fields) { if (k.trim()) obj[k.trim()] = v.trim() || 'NA'; }
    if (Object.keys(obj).length === 0) { setError('Add at least one field'); return; }
    setSaving(true);
    try {
      await api.savePipelineRequirementSheet(leadId, obj);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900">Requirement Sheet {latest && <span className="text-xs font-normal text-gray-400">(editing creates v{latest.version + 1})</span>}</h3>
        </div>
        {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <div className="space-y-2">
          {fields.map(([k, v], idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <input value={k} onChange={e => updateField(idx, 'k', e.target.value)} placeholder="Field name" className="w-1/3 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium" />
              <input value={v} onChange={e => updateField(idx, 'v', e.target.value)} placeholder="Value" className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs" />
              <button type="button" onClick={() => markNA(idx)} className="text-[10px] font-bold text-gray-500 hover:text-amber-600 px-1.5">NA</button>
              <button type="button" onClick={() => removeField(idx)} className="p-1 text-gray-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={addField} className="text-xs font-semibold text-[#00288e] hover:bg-blue-50 px-2 py-1 rounded flex items-center space-x-1"><Plus className="w-3.5 h-3.5" /><span>Add Field</span></button>
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Saving...' : 'Save Requirement Sheet'}</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5">
        <h3 className="font-bold text-sm text-gray-900 mb-3">Version History</h3>
        <div className="space-y-2">
          {data.requirementSheets.length === 0 && <p className="text-xs text-gray-400">No versions saved yet.</p>}
          {data.requirementSheets.map((rs: any) => (
            <div key={rs.id} className="p-2.5 bg-gray-50 rounded-lg text-xs">
              <p className="font-bold text-gray-800">Version {rs.version}</p>
              <p className="text-[10px] text-gray-400">{fmtDateTime(rs.updatedAt)} · {rs.updatedByName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ===================== FOLLOW-UPS =====================

const CALL_TYPES: CallType[] = ['Intro Call', 'Follow-up Call', 'Negotiation Call', 'Technical Discussion Call', 'Call Not Answered', 'WhatsApp'];
const MEETING_TYPES: MeetingType[] = ['Follow-up Meeting', 'Negotiation Meeting', 'Technical Meeting', 'Site Visit', 'Technical Assessment'];

const FollowUpsTab: React.FC<{ leadId: string; data: any; onRefresh: () => void }> = ({ leadId, data, onRefresh }) => {
  const [activityKind, setActivityKind] = useState<'call' | 'meeting'>('call');
  const [type, setType] = useState<string>(CALL_TYPES[0]);
  const [remark, setRemark] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [photos, setPhotos] = useState<ActivityPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const photoRequired = activityKind === 'meeting' && PHOTO_REQUIRED_MEETING_TYPES.includes(type as MeetingType);

  const switchKind = (kind: 'call' | 'meeting') => {
    setActivityKind(kind);
    setType(kind === 'call' ? CALL_TYPES[0] : MEETING_TYPES[0]);
    setPhotos([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!remark.trim()) { setError('Remark is required'); return; }
    if (photoRequired && photos.length === 0) { setError('This meeting type requires at least one GPS-tagged site photo'); return; }
    setSaving(true);
    try {
      await api.createFollowUp(leadId, { activityKind, type, remark, nextAction, nextActionDate, photos });
      setRemark(''); setNextAction(''); setNextActionDate(''); setPhotos([]);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to log activity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-gray-900">Log Activity</h3>
        {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button type="button" onClick={() => switchKind('call')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold ${activityKind === 'call' ? 'bg-white shadow-xs text-[#00288e]' : 'text-gray-500'}`}>Call</button>
            <button type="button" onClick={() => switchKind('meeting')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold ${activityKind === 'meeting' ? 'bg-white shadow-xs text-[#00288e]' : 'text-gray-500'}`}>Meeting / Site Visit</button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
              {(activityKind === 'call' ? CALL_TYPES : MEETING_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Remark *</label>
            <textarea rows={2} value={remark} onChange={e => setRemark(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Next Action</label>
              <input value={nextAction} onChange={e => setNextAction(e.target.value)} className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Next Action Date</label>
              <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            </div>
          </div>
          {photoRequired && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Site Photos (GPS-verified, mandatory)</label>
              <PhotoGpsCapture photos={photos} onChange={setPhotos} minPhotos={1} />
            </div>
          )}
          {type === 'Call Not Answered' && <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">A follow-up will automatically be scheduled for tomorrow.</p>}
          <button type="submit" disabled={saving} className="w-full py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Logging...' : 'Log Activity'}</button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs p-5">
        <h3 className="font-bold text-sm text-gray-900 mb-3">Activity History</h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {data.followUps.length === 0 && <p className="text-xs text-gray-400">No follow-ups logged yet.</p>}
          {data.followUps.map((f: any) => (
            <div key={f.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{f.type}</span>
                <span className="text-[10px] text-gray-400">{fmtDateTime(f.createdAt)}</span>
              </div>
              <p className="text-gray-700">{f.remark}</p>
              <p className="text-[10px] text-gray-400">Stage at logging: {f.stageAtLogging.replace(/_/g, ' ')} · by {f.createdByName}</p>
              {f.photos && f.photos.length > 0 && (
                <div className="flex items-center space-x-1.5 pt-1">
                  {f.photos.map((p: any, i: number) => (
                    <img key={i} src={p.url} className="w-10 h-10 rounded object-cover border border-gray-200" title={`GPS: ${p.latitude?.toFixed(4)}, ${p.longitude?.toFixed(4)}`} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ===================== QUOTATION & NEGOTIATION =====================

const QuotationNegotiationTab: React.FC<{ leadId: string; data: any; onRefresh: () => void }> = ({ leadId, data, onRefresh }) => {
  const { lead } = data;
  const [items, setItems] = useState([{ description: '', quantity: 1, unit: 'Unit', rate: 0, taxPercent: 18 }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [negDiscussion, setNegDiscussion] = useState('');
  const [negPrice, setNegPrice] = useState('');
  const [negReqChanged, setNegReqChanged] = useState(false);
  const [negSaving, setNegSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unit: 'Unit', rate: 0, taxPercent: 18 }]);
  const updateItem = (idx: number, patch: any) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const removeItem = (idx: number) => setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const generateQuotation = async () => {
    setError(null);
    const valid = items.filter(it => it.description.trim());
    if (valid.length === 0) { setError('Add at least one item'); return; }
    setSaving(true);
    try {
      await api.createPipelineQuotation(leadId, { items: valid });
      setItems([{ description: '', quantity: 1, unit: 'Unit', rate: 0, taxPercent: 18 }]);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to generate quotation');
    } finally {
      setSaving(false);
    }
  };

  const submitQuotation = async (quotationId: string, file: File) => {
    setSubmittingId(quotationId);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await api.submitPipelineQuotation(quotationId, dataUrl);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit quotation');
    } finally {
      setSubmittingId(null);
    }
  };

  const addNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negDiscussion.trim() || !negPrice) return;
    setNegSaving(true);
    try {
      await api.createNegotiation(leadId, { discussion: negDiscussion, priceOffered: Number(negPrice), requirementChanged: negReqChanged });
      setNegDiscussion(''); setNegPrice(''); setNegReqChanged(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save negotiation entry');
    } finally {
      setNegSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-gray-900">Generate Quotation (system-generated, no upload)</h3>
        {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
        {lead.leadType === 'service' && <p className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2">Service quotations automatically include the 5-page repair T&C (Hindi + English) for customer signature.</p>}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold"><tr><th className="py-2 px-2 text-left">Description</th><th className="py-2 px-2 text-right w-20">Qty</th><th className="py-2 px-2 text-right w-24">Rate</th><th className="py-2 px-2 text-right w-20">Tax%</th><th></th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-2"><input value={it.description} onChange={e => updateItem(idx, { description: e.target.value })} placeholder="Item description" className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs" /></td>
                  <td className="py-1.5 px-2"><input type="number" value={it.quantity} onChange={e => updateItem(idx, { quantity: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
                  <td className="py-1.5 px-2"><input type="number" value={it.rate} onChange={e => updateItem(idx, { rate: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
                  <td className="py-1.5 px-2"><input type="number" value={it.taxPercent} onChange={e => updateItem(idx, { taxPercent: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs text-right" /></td>
                  <td><button type="button" onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addItem} className="w-full py-2 text-xs font-semibold text-[#00288e] hover:bg-blue-50 flex items-center justify-center space-x-1.5 border-t border-gray-100"><Plus className="w-3.5 h-3.5" /><span>Add Item</span></button>
        </div>
        <div className="flex justify-end"><button onClick={generateQuotation} disabled={saving} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Generating...' : 'Generate Quotation'}</button></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5">
        <h3 className="font-bold text-sm text-gray-900 mb-3">Quotations</h3>
        <div className="space-y-2">
          {data.quotations.length === 0 && <p className="text-xs text-gray-400">No quotations generated yet.</p>}
          {data.quotations.map((q: any) => (
            <div key={q.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between text-xs">
              <div>
                <p className="font-mono font-bold text-gray-800">{q.quotationNumber}</p>
                <p className="text-gray-500">{formatINR(q.grandTotal)} · <span className="capitalize">{q.status}</span>{q.includesRepairTnC ? ' · + Repair T&C' : ''}</p>
              </div>
              {q.status === 'draft' && (
                <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] rounded-lg font-semibold cursor-pointer flex items-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5" /><span>{submittingId === q.id ? 'Submitting...' : 'Submit (email screenshot)'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) submitQuotation(q.id, f); e.target.value = ''; }} />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-gray-900">Negotiation Table</h3>
        <form onSubmit={addNegotiation} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Discussion</label>
            <input value={negDiscussion} onChange={e => setNegDiscussion(e.target.value)} className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Price Offered (₹)</label>
            <input type="number" value={negPrice} onChange={e => setNegPrice(e.target.value)} className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <label className="flex items-center space-x-1.5 text-[11px] font-semibold text-gray-700"><input type="checkbox" checked={negReqChanged} onChange={e => setNegReqChanged(e.target.checked)} className="rounded" /><span>Req. changed</span></label>
            <button type="submit" disabled={negSaving} className="px-3 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">Add</button>
          </div>
        </form>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold"><tr><th className="py-2 px-3 text-left">Date</th><th className="py-2 px-3 text-left">Discussion</th><th className="py-2 px-3 text-right">Price Offered</th><th className="py-2 px-3">Req. Changed</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.negotiations.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-gray-400">No negotiation entries yet.</td></tr>}
              {data.negotiations.map((n: any) => (
                <tr key={n.id}><td className="py-2 px-3 text-gray-500">{fmtDate(n.entryDate)}</td><td className="py-2 px-3 text-gray-700">{n.discussion}</td><td className="py-2 px-3 text-right font-bold">{formatINR(n.priceOffered)}</td><td className="py-2 px-3 text-center">{n.requirementChanged ? '✓' : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {lead.lastNegotiatedPrice && <p className="text-xs text-gray-600">Last negotiated price: <strong className="text-gray-900">{formatINR(lead.lastNegotiatedPrice)}</strong></p>}
      </div>
    </div>
  );
};

// ===================== ORDER PUNCH & APPROVAL =====================

const DOC_TYPES = [
  { id: 'advance_payment_proof', label: 'Advance Payment Proof' },
  { id: 'po_or_contract', label: 'PO / Agreed Contract' },
  { id: 'kyc_pan', label: 'KYC — PAN' },
  { id: 'kyc_aadhaar', label: 'KYC — Aadhaar' },
  { id: 'kyc_gst', label: 'KYC — GST Certificate' }
];

const OrderTab: React.FC<{ leadId: string; data: any; onRefresh: () => void }> = ({ leadId, data, onRefresh }) => {
  const { hasPermission, user } = useAuth();
  const { lead, quotations, orders } = data;
  const [quotationId, setQuotationId] = useState(quotations[0]?.id || '');
  const [etd, setEtd] = useState('');
  const [docs, setDocs] = useState<Record<string, { fileName: string; fileUrl: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [holdReason, setHoldReason] = useState('');

  const existingOrder = orders[0];
  const canApprove = ['super_admin', 'admin', 'order_approver'].includes(user?.role || '');

  const handleDoc = async (type: string, file: File) => {
    const fileUrl = await readFileAsDataUrl(file);
    setDocs(prev => ({ ...prev, [type]: { fileName: file.name, fileUrl } }));
  };

  const punch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!quotationId) { setError('Select a quotation'); return; }
    if (!etd) { setError('ETD is mandatory'); return; }
    setSaving(true);
    try {
      const documents = Object.entries(docs).map(([type, d]: [string, any]) => ({ type, ...d }));
      await api.punchOrder(leadId, { quotationId, etd, documents });
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to punch order');
    } finally {
      setSaving(false);
    }
  };

  const review = async (decision: 'approve' | 'hold' | 'reject') => {
    if (!existingOrder) return;
    if (decision === 'hold' && !holdReason.trim()) { alert('A reason is required to put the order On Hold'); return; }
    try {
      await api.reviewOrder(existingOrder.id, decision, holdReason);
      setHoldReason('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to record review');
    }
  };

  if (existingOrder && existingOrder.status !== 'on_hold') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Order {existingOrder.orderNumber || '(pending number)'}</h3>
            <p className="text-xs text-gray-500">ETD: {fmtDate(existingOrder.etd)} · Punch count: {existingOrder.punchCount}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${existingOrder.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : existingOrder.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{existingOrder.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {existingOrder.documents.map((d: any) => <div key={d.id} className="p-2 bg-gray-50 rounded-lg"><p className="font-semibold text-gray-700">{DOC_TYPES.find(t => t.id === d.type)?.label || d.type}</p><p className="text-gray-400 truncate">{d.fileName}</p></div>)}
        </div>
        {existingOrder.status === 'punched' && canApprove && (
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <input value={holdReason} onChange={e => setHoldReason(e.target.value)} placeholder="Reason (required for On Hold / Reject)" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
            <div className="flex items-center space-x-2">
              <button onClick={() => review('approve')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold">Approve</button>
              <button onClick={() => review('hold')} className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold">Put On Hold</button>
              {lead.leadType === 'service' && <button onClick={() => review('reject')} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold">Reject</button>}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-4">
      <h3 className="font-bold text-sm text-gray-900">{existingOrder ? 'Re-punch Order (after On Hold)' : 'Punch Order'}</h3>
      {existingOrder?.holdReason && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">On Hold reason: {existingOrder.holdReason}</p>}
      {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><span>{error}</span></div>}
      <form onSubmit={punch} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Quotation *</label>
            <select value={quotationId} onChange={e => setQuotationId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
              <option value="">Select quotation...</option>
              {quotations.map((q: any) => <option key={q.id} value={q.id}>{q.quotationNumber} — {formatINR(q.grandTotal)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ETD (Estimated Date of Delivery) *</label>
            <input type="date" value={etd} onChange={e => setEtd(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Mandatory Documents</label>
          <div className="grid grid-cols-2 gap-2">
            {DOC_TYPES.map(dt => (
              <label key={dt.id} className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${docs[dt.id] ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="font-medium text-gray-700">{dt.label}{docs[dt.id] ? ' ✓' : ''}</span>
                <Upload className="w-3.5 h-3.5 text-gray-400" />
                <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleDoc(dt.id, f); e.target.value = ''; }} />
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving} className="w-full py-2.5 bg-[#00288e] text-white rounded-lg text-xs font-semibold disabled:opacity-60">{saving ? 'Punching...' : 'Punch Order'}</button>
      </form>
    </div>
  );
};

// ===================== EXECUTION =====================

const ExecutionTab: React.FC<{ leadId: string; data: any; onRefresh: () => void }> = ({ leadId, data, onRefresh }) => {
  const { lead, orders } = data;
  const approvedOrder = orders.find((o: any) => o.status === 'approved');

  if (!approvedOrder) {
    return <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 text-center text-xs text-gray-400">Execution starts once the order is approved.</div>;
  }

  return lead.leadType === 'service'
    ? <ServiceExecutionPanel leadId={leadId} order={approvedOrder} onRefresh={onRefresh} />
    : <SalesExecutionPanel leadId={leadId} order={approvedOrder} onRefresh={onRefresh} />;
};

const SalesExecutionPanel: React.FC<{ leadId: string; order: any; onRefresh: () => void }> = ({ leadId, order, onRefresh }) => {
  const [execData, setExecData] = useState<{ listItems: any[]; stages: any[] } | null>(null);
  const [itemName, setItemName] = useState('');
  const [listType, setListType] = useState<'purchase' | 'manufacturing'>('purchase');
  const [tentativeDate, setTentativeDate] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [notApplicable, setNotApplicable] = useState(false);

  const load = async () => setExecData(await api.getExecution(order.id));
  useEffect(() => { load(); }, [order.id]);

  if (!execData) return <div className="text-xs text-gray-400">Loading execution...</div>;

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addExecutionItem(order.id, { listType, itemName, tentativeDate, dispatchDate, notApplicable });
    setItemName(''); setTentativeDate(''); setDispatchDate(''); setNotApplicable(false);
    load();
  };

  const clubStages = async () => { await api.clubExecutionStages(order.id); load(); };

  const updateStage = async (id: string, patch: any) => { await api.updateExecutionStage(id, patch); load(); onRefresh(); };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-gray-900">Execution — Order {order.orderNumber}</h3>
          <p className="text-xs text-gray-500">Welcome call logged: {execData.stages[0]?.welcomeCallLogged ? 'Yes' : 'No'} · Site readiness checked: {execData.stages[0]?.siteReadinessChecked ? 'Yes' : 'No'}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={async () => { await api.logWelcomeCall(order.id); load(); }} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] rounded-lg text-xs font-semibold">Log Welcome Call</button>
          <SiteReadinessButton orderId={order.id} onDone={load} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-gray-900">Purchase & Manufacturing Lists</h3>
        <form onSubmit={addItem} className="grid grid-cols-6 gap-2 items-end">
          <select value={listType} onChange={e => setListType(e.target.value as any)} className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium col-span-1"><option value="purchase">Purchase</option><option value="manufacturing">Manufacturing</option></select>
          <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Item name" disabled={notApplicable} className="px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs col-span-2 disabled:opacity-50" />
          <input type="date" value={tentativeDate} onChange={e => setTentativeDate(e.target.value)} className="px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs" title="Tentative date" />
          <input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className="px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs" title="Dispatch date" />
          <button type="submit" className="px-3 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold">Add</button>
          <label className="col-span-6 flex items-center space-x-1.5 text-[11px] text-gray-600"><input type="checkbox" checked={notApplicable} onChange={e => setNotApplicable(e.target.checked)} className="rounded" /><span>Not Applicable</span></label>
        </form>
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold"><tr><th className="py-2 px-2 text-left">List</th><th className="py-2 px-2 text-left">Item</th><th className="py-2 px-2">Tentative</th><th className="py-2 px-2">Dispatch</th><th className="py-2 px-2">Done</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {execData.listItems.map(it => (
              <tr key={it.id}>
                <td className="py-1.5 px-2 capitalize">{it.listType}</td>
                <td className="py-1.5 px-2">{it.itemName}</td>
                <td className="py-1.5 px-2 text-center">{fmtDate(it.tentativeDate)}</td>
                <td className="py-1.5 px-2 text-center">{fmtDate(it.dispatchDate)}</td>
                <td className="py-1.5 px-2 text-center">
                  <input type="checkbox" checked={it.completed} onChange={async e => { await api.updateExecutionItem(it.id, { completed: e.target.checked }); load(); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={clubStages} className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold">Club Items by Dispatch Date → Create Stages</button>
      </div>

      <div className="space-y-4">
        {execData.stages.filter(s => s.stageIndex > 0).map(stage => (
          <StageCard key={stage.id} stage={stage} onUpdate={patch => updateStage(stage.id, patch)} />
        ))}
      </div>
    </div>
  );
};

const SiteReadinessButton: React.FC<{ orderId: string; onDone: () => void }> = ({ orderId, onDone }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const handle = async (files: FileList) => {
    setBusy(true);
    try {
      const urls = await Promise.all(Array.from(files).map(readFileAsDataUrl));
      await api.confirmSiteReadiness(orderId, urls);
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <>
      <button onClick={() => inputRef.current?.click()} disabled={busy} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold disabled:opacity-60">{busy ? 'Uploading...' : 'Confirm Site Readiness (upload site images)'}</button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files && e.target.files.length) handle(e.target.files); e.target.value = ''; }} />
    </>
  );
};

const StageCard: React.FC<{ stage: any; onUpdate: (patch: any) => void }> = ({ stage, onUpdate }) => {
  const dispatchInputRef = React.useRef<HTMLInputElement>(null);
  const completionInputRef = React.useRef<HTMLInputElement>(null);

  const uploadDispatchDoc = async (file: File) => onUpdate({ dispatchDocUrl: await readFileAsDataUrl(file), status: 'dispatched' });
  const uploadCompletion = async (files: FileList) => onUpdate({ completionPhotoUrls: await Promise.all(Array.from(files).map(readFileAsDataUrl)), onsiteComplete: true });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-gray-900">Stage {stage.stageIndex} — Dispatch {fmtDate(stage.dispatchDate)}</h4>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">{stage.status.replace('_', ' ')}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <label className="flex items-center space-x-1.5"><input type="checkbox" checked={stage.purchaseListComplete} onChange={e => onUpdate({ purchaseListComplete: e.target.checked })} /><span>Purchase List Done</span></label>
        <label className="flex items-center space-x-1.5"><input type="checkbox" checked={stage.manufacturingListComplete} onChange={e => onUpdate({ manufacturingListComplete: e.target.checked })} /><span>Manufacturing List Done</span></label>
        <div>
          <select value={stage.manufacturingStep || 'fabrication'} onChange={e => onUpdate({ manufacturingStep: e.target.value })} className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium">
            {MANUFACTURING_STEPS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <label className="flex items-center space-x-1.5"><input type="checkbox" checked={stage.materialDelivered} onChange={e => onUpdate({ materialDelivered: e.target.checked })} /><span>Material Delivered</span></label>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
        <button onClick={() => dispatchInputRef.current?.click()} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${stage.dispatchDocUrl ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#00288e]'}`}>{stage.dispatchDocUrl ? 'Dispatch Doc ✓' : 'Attach Invoice / DC'}</button>
        <input ref={dispatchInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadDispatchDoc(f); e.target.value = ''; }} />
        <label className="flex items-center space-x-1.5 text-xs"><input type="checkbox" checked={stage.onsiteTeamAssigned} onChange={e => onUpdate({ onsiteTeamAssigned: e.target.checked })} /><span>On-site Team Assigned</span></label>
        <button onClick={() => completionInputRef.current?.click()} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${stage.onsiteComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{stage.onsiteComplete ? 'On-site Complete ✓' : 'Upload Completion Photos'}</button>
        <input ref={completionInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files?.length) uploadCompletion(e.target.files); e.target.value = ''; }} />
      </div>
    </div>
  );
};

const ServiceExecutionPanel: React.FC<{ leadId: string; order: any; onRefresh: () => void }> = ({ leadId, order, onRefresh }) => {
  const [execData, setExecData] = useState<{ execution: any; tracks: any[] } | null>(null);
  const [onsiteRequired, setOnsiteRequired] = useState(false);

  const load = async () => setExecData(await api.getServiceExecution(order.id));
  useEffect(() => { load(); }, [order.id]);

  if (!execData) return <div className="text-xs text-gray-400">Loading...</div>;

  if (!execData.execution) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-3">
        <h3 className="font-bold text-sm text-gray-900">Start Repair Execution — Dismantling</h3>
        <label className="flex items-center space-x-1.5 text-xs"><input type="checkbox" checked={onsiteRequired} onChange={e => setOnsiteRequired(e.target.checked)} className="rounded" /><span>On-site installation will be required after repair</span></label>
        <button onClick={async () => { await api.startServiceExecution(order.id, onsiteRequired); load(); onRefresh(); }} className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold">Log Dismantling & Start</button>
      </div>
    );
  }

  const { execution, tracks } = execData;
  const trackLabels: Record<string, string> = { spares: 'Spares (Purchase)', machining: 'Machining (Rotor/Shaft/Chamber)', labour: 'Labour (Service + Painting)' };

  const updateTrack = async (id: string, patch: any) => { await api.updateServiceTrack(id, patch); load(); };
  const updateExecution = async (patch: any) => { await api.updateServiceExecution(execution.id, patch); load(); onRefresh(); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tracks.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-2xs p-4 space-y-2">
            <h4 className="font-bold text-sm text-gray-900">{trackLabels[t.trackType]}</h4>
            <input
              defaultValue={t.items.join(', ')}
              onBlur={e => updateTrack(t.id, { items: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean), listGenerated: true })}
              placeholder="Items, comma separated"
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
            {t.trackType === 'spares' && <label className="flex items-center space-x-1.5 text-xs"><input type="checkbox" checked={!!t.purchaseComplete} onChange={e => updateTrack(t.id, { purchaseComplete: e.target.checked })} /><span>Purchase Complete</span></label>}
            {t.trackType === 'machining' && <label className="flex items-center space-x-1.5 text-xs"><input type="checkbox" checked={!!t.jobComplete} onChange={e => updateTrack(t.id, { jobComplete: e.target.checked })} /><span>Job Complete</span></label>}
            {t.trackType === 'labour' && <label className="flex items-center space-x-1.5 text-xs"><input type="checkbox" checked={!!t.paintingComplete} onChange={e => updateTrack(t.id, { paintingComplete: e.target.checked })} /><span>Painting Complete</span></label>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-3">
        <h3 className="font-bold text-sm text-gray-900">Assembly, Dispatch & Installation</h3>
        <label className="flex items-center space-x-1.5 text-xs"><input type="checkbox" checked={execution.assemblyInstallationComplete} onChange={e => updateExecution({ assemblyInstallationComplete: e.target.checked })} /><span>Assembly / Installation at Factory Complete</span></label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dispatch Date</label>
            <input type="date" value={execution.dispatchDate || ''} onChange={e => updateExecution({ dispatchDate: e.target.value })} className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dispatch Document</label>
            <input type="file" onChange={async e => { const f = e.target.files?.[0]; if (f) updateExecution({ dispatchDocUrl: await readFileAsDataUrl(f) }); }} className="w-full text-xs" />
          </div>
        </div>
        {execution.onsiteInstallationRequired && (
          <label className="flex items-center space-x-1.5 text-xs"><input type="checkbox" checked={execution.onsiteInstallationComplete} onChange={e => updateExecution({ onsiteInstallationComplete: e.target.checked })} /><span>On-site Installation Complete</span></label>
        )}
        {!execution.onsiteInstallationRequired && <p className="text-[11px] text-gray-400">On-site installation: Not Applicable</p>}
      </div>
    </div>
  );
};
