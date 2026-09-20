import React, { useState } from 'react';
import { X, PhoneCall, Clock, CheckCircle2, AlertCircle, Mic, Play, Pause } from 'lucide-react';
import { api } from '../../services/api';
import { Lead, CallStatus, CallOutcome } from '../../types';

interface RecordCallModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordCallModal: React.FC<RecordCallModalProps> = ({ lead, isOpen, onClose, onSuccess }) => {
  const [duration, setDuration] = useState('240');
  const [status, setStatus] = useState<CallStatus>('completed');
  const [outcome, setOutcome] = useState<CallOutcome>('interested');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!notes.trim()) {
      setError('Please add summary notes of your discussion with the customer.');
      return;
    }

    setLoading(true);
    try {
      await api.logCall(lead.id, {
        duration: Number(duration) || 120,
        notes: notes.trim(),
        outcome,
        status,
        recording_url: `https://cdn.omjyotiengg.com/recordings/call_${lead.id}_${Date.now()}.mp3`
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-blue-600" />
              <span>Record Sales Call Log</span>
            </h2>
            <p className="text-xs text-gray-500">
              Call with <strong className="text-gray-700">{lead.customerName}</strong> ({lead.companyName})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Call Duration (seconds)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Call Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as CallStatus)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
              >
                <option value="completed">Completed Call</option>
                <option value="missed">Missed / Ringing</option>
                <option value="rejected">Call Rejected</option>
                <option value="no_answer">No Answer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Customer Outcome & Interest
            </label>
            <select
              value={outcome}
              onChange={e => setOutcome(e.target.value as CallOutcome)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
            >
              <option value="interested">Interested (Wants Proposal / Site Visit)</option>
              <option value="follow_up_scheduled">Follow Up Scheduled</option>
              <option value="no_decision">Pending Technical Consultation</option>
              <option value="not_interested">Not Interested / Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Discussion Notes & Key Objections / Specs *
            </label>
            <textarea
              rows={4}
              required
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Discussed raw water TDS and daily flow requirements. Customer requested technical GA drawing and quote for MBBR STP plant..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00288e]"
            />
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-[#00288e]">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">VoIP Recording Audio: Encrypted & Auto-Attached</span>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
              Active
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5"
            >
              {loading ? 'Logging Call...' : 'Save Call Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
