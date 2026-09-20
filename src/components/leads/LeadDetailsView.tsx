import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  PhoneCall,
  Mail,
  Building,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  User,
  Check,
  Send,
  FileText,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Lead, CallLog, LeadNote, LeadHistoryItem, LeadStatus } from '../../types';

interface LeadDetailsViewProps {
  leadId: string;
  onBack: () => void;
  onEditLead: (lead: Lead) => void;
  onRecordCall: (lead: Lead) => void;
}

export const LeadDetailsView: React.FC<LeadDetailsViewProps> = ({
  leadId,
  onBack,
  onEditLead,
  onRecordCall
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    lead: Lead;
    call_history: CallLog[];
    notes: LeadNote[];
    activity_timeline: LeadHistoryItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'calls' | 'notes'>('timeline');
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('contacted');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getLeadById(leadId);
      setData(res);
      if (res.lead) {
        setTargetStatus(res.lead.leadStatus);
      }
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [leadId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      await api.addLeadNote(leadId, newNote.trim());
      setNewNote('');
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleStatusChangeSubmit = async () => {
    if (!data?.lead) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateLeadStatus(leadId, targetStatus, statusReason);
      if (targetStatus === 'converted') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      setStatusModalOpen(false);
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Status transition error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">New</span>;
      case 'contacted':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Contacted</span>;
      case 'interested':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Interested</span>;
      case 'qualified':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Qualified</span>;
      case 'converted':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Converted Won</span>;
      case 'lost':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Lost</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 capitalize">{status}</span>;
    }
  };

  const pipelineStages: { id: LeadStatus; label: string }[] = [
    { id: 'new', label: '1. New' },
    { id: 'contacted', label: '2. Contacted' },
    { id: 'interested', label: '3. Interested' },
    { id: 'qualified', label: '4. Qualified' },
    { id: 'converted', label: '5. Converted' }
  ];

  if (loading || !data) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#00288e] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-500">Loading lead profile...</p>
        </div>
      </div>
    );
  }

  const { lead, call_history, notes, activity_timeline } = data;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Leads</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onRecordCall(lead)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] border border-blue-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Record Call</span>
          </button>

          <button
            onClick={() => {
              setTargetStatus(lead.leadStatus);
              setStatusModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Change Status</span>
          </button>

          <button
            onClick={() => onEditLead(lead)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            title="Edit lead"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Lead Header Card matching Image 7.png */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {lead.leadIdNumber}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{lead.customerName}</h1>
              {getStatusBadge(lead.leadStatus)}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
              <span className="font-semibold text-gray-700">{lead.companyName}</span>
              <span>•</span>
              <span>{lead.industryType}</span>
              <span>•</span>
              <span>{lead.location}</span>
            </p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Estimated Lead Value</span>
            <span className="text-2xl font-bold text-emerald-700">{formatINR(lead.leadValue)}</span>
          </div>
        </div>

        {/* Status Progression Bar */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Sales Pipeline Stage:</span>
            <span className="capitalize font-bold text-[#00288e]">{lead.leadStatus.replace('_', ' ')}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {pipelineStages.map((stage, idx) => {
              const activeIndex = pipelineStages.findIndex(s => s.id === lead.leadStatus);
              const isCurrent = lead.leadStatus === stage.id;
              const isPassed = activeIndex >= idx && lead.leadStatus !== 'lost';
              return (
                <div
                  key={stage.id}
                  className={`py-2 px-3 rounded-lg text-center text-xs font-semibold border transition-all ${
                    isCurrent
                      ? 'bg-[#00288e] text-white border-[#00288e] shadow-xs'
                      : isPassed
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
                >
                  <span className="block truncate">{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Profile & Info vs Timeline/Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Info Card */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2.5">
              Contact & Company Profile
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Primary Phone</span>
                <a href={`tel:${lead.phone}`} className="font-semibold text-[#00288e] hover:underline flex items-center space-x-1.5 mt-0.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{lead.phone}</span>
                </a>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">Email Address</span>
                <a href={`mailto:${lead.email}`} className="font-medium text-gray-800 hover:underline flex items-center space-x-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{lead.email || 'Not provided'}</span>
                </a>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">Company / Organization</span>
                <div className="font-medium text-gray-800 flex items-center space-x-1.5 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <span>{lead.companyName || 'Individual / Contractor'}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">Project Location</span>
                <div className="font-medium text-gray-800 flex items-center space-x-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{lead.location}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">Lead Source</span>
                <span className="font-medium text-gray-700 capitalize">{lead.leadSource}</span>
              </div>
            </div>
          </div>

          {/* Product Interests & Assignment */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2.5">
              Engineering Requirements
            </h3>

            <div>
              <span className="text-gray-400 block text-[11px] mb-1.5">Products / Systems of Interest</span>
              <div className="flex flex-wrap gap-1.5">
                {(lead.productInterests || ['Water Treatment Plant']).map((prod, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-md text-xs font-semibold">
                    {prod}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Assigned Team Lead:</span>
                <span className="font-semibold text-gray-800">{lead.assignedTeamLeadName || 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Assigned Telecaller:</span>
                <span className="font-semibold text-[#00288e]">{lead.assignedTelecallerName || 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Priority Level:</span>
                <span className="font-bold uppercase text-red-600">{lead.priority}</span>
              </div>
            </div>

            {lead.customerNotes && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-400 block text-[11px] mb-1">Customer Initial Specs / Notes</span>
                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg italic">
                  "{lead.customerNotes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Activity, Calls & Notes Tabs matching Image 7.png */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-gray-200 px-5 pt-3 bg-gray-50/50">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-[#00288e] text-[#00288e]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Activity Audit Timeline ({activity_timeline.length})
            </button>

            <button
              onClick={() => setActiveTab('calls')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'calls'
                  ? 'border-[#00288e] text-[#00288e]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Call Recordings & Logs ({call_history.length})
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-[#00288e] text-[#00288e]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Customer Notes ({notes.length})
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* 1. TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {activity_timeline.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-start space-x-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-[#00288e] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{item.changedByName}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(item.changedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1">{item.newValue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. CALL LOGS & RECORDINGS */}
            {activeTab === 'calls' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Recorded Calls with Customer</span>
                  <button
                    onClick={() => onRecordCall(lead)}
                    className="px-3 py-1 bg-[#00288e] text-white rounded-md text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Log New Call</span>
                  </button>
                </div>

                {call_history.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No calls logged yet. Click "Record Call" to log telecaller interaction.
                  </div>
                ) : (
                  call_history.map(call => (
                    <div key={call.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <PhoneCall className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-gray-900">{call.userName}</span>
                          <span className="text-gray-400">({call.callDurationSeconds} seconds)</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {new Date(call.callDate).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100">
                        {call.notes}
                      </p>

                      {/* Simulated Audio Waveform / Player matching Image 7.png */}
                      <div className="flex items-center justify-between p-2.5 bg-blue-900 text-white rounded-lg text-xs">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setIsPlayingAudio(isPlayingAudio === call.id ? null : call.id)}
                            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                          >
                            {isPlayingAudio === call.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <span className="font-mono text-xs">0:00 / 7:00</span>
                            <span className="text-[10px] text-blue-200 block">Encrypted Call Recording</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 opacity-70">
                          <div className="w-1 h-3 bg-blue-300 rounded-full animate-pulse"></div>
                          <div className="w-1 h-5 bg-blue-300 rounded-full"></div>
                          <div className="w-1 h-2 bg-blue-300 rounded-full"></div>
                          <div className="w-1 h-6 bg-blue-300 rounded-full animate-pulse"></div>
                          <div className="w-1 h-4 bg-blue-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Add engineering notes, site survey details, pump specifications..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00288e]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !newNote.trim()}
                      className="px-4 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Note</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-3 pt-2">
                  {notes.map(note => (
                    <div key={note.id} className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-gray-500 text-[11px]">
                        <span className="font-bold text-gray-800">{note.userName}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700">{note.noteText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Status Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-sm text-gray-900">Change Lead Status</h3>
            <p className="text-xs text-gray-500">
              Current status: <strong className="capitalize">{lead.leadStatus}</strong>
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">New Stage</label>
              <select
                value={targetStatus}
                onChange={e => setTargetStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00288e]"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted (Won PO)</option>
                <option value="lost">Lost</option>
              </select>

              {(targetStatus === 'converted' || targetStatus === 'lost') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {targetStatus === 'converted' ? 'Win Reason / PO Reference' : 'Loss Reason & Competitor'}
                  </label>
                  <textarea
                    rows={2}
                    value={statusReason}
                    onChange={e => setStatusReason(e.target.value)}
                    placeholder={targetStatus === 'converted' ? 'e.g. Won against Thermax due to custom RO design' : 'e.g. Budget constraints, opted for local pump'}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleStatusChangeSubmit}
                className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                {isUpdatingStatus ? 'Updating...' : 'Confirm Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
