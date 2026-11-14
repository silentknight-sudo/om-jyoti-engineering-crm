import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { PipelineLeadDetailView } from './PipelineLeadDetailView';

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// Screen 09 — Follow-up queue: manage all next actions while retaining auditable visit proof.
export const FollowUpQueueView: React.FC = () => {
  const [data, setData] = useState<{ due: any[]; overdue: any[]; upcoming: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overdue' | 'due' | 'upcoming'>('overdue');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setData(await api.getFollowUpDashboard());
    } catch (err) {
      console.error('Failed to load follow-up dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (selectedLeadId) {
    return <PipelineLeadDetailView leadId={selectedLeadId} onBack={() => { setSelectedLeadId(null); load(); }} />;
  }

  if (loading || !data) return <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Loading follow-up queue...</div>;

  const list = data[tab];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Follow-up Queue</h1>
        <p className="text-xs text-gray-500 mt-0.5">Every lead's next action, across both pipelines, independent of stage.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { id: 'overdue', label: 'Overdue', count: data.overdue.length, icon: AlertTriangle, activeClass: 'border-red-300 bg-red-50 ring-2 ring-red-200', iconClass: 'text-red-600' },
          { id: 'due', label: 'Due Today', count: data.due.length, icon: Clock, activeClass: 'border-amber-300 bg-amber-50 ring-2 ring-amber-200', iconClass: 'text-amber-600' },
          { id: 'upcoming', label: 'Upcoming', count: data.upcoming.length, icon: Calendar, activeClass: 'border-blue-300 bg-blue-50 ring-2 ring-blue-200', iconClass: 'text-blue-600' }
        ].map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`p-4 rounded-xl border text-left transition-all ${active ? t.activeClass : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${t.iconClass}`} />
                <span className="text-2xl font-bold text-gray-900">{t.count}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700 mt-1">{t.label}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-4">Lead</th>
              <th className="py-2.5 px-4">Stage</th>
              <th className="py-2.5 px-4">Next Action</th>
              <th className="py-2.5 px-4">Due Date</th>
              <th className="py-2.5 px-4">Owner</th>
              <th className="py-2.5 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">Nothing in this queue.</td></tr>}
            {list.map((item: any) => (
              <tr key={item.leadId} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLeadId(item.leadId)}>
                <td className="py-2.5 px-4">
                  <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.leadNumber}</span>
                  <p className="font-bold text-gray-900 mt-1">{item.customerName}</p>
                </td>
                <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-semibold text-gray-700">{item.stage.replace(/_/g, ' ')}</span></td>
                <td className="py-2.5 px-4 text-gray-700">{item.nextAction || '—'}</td>
                <td className="py-2.5 px-4 text-gray-600">{fmtDate(item.nextActionDate)}</td>
                <td className="py-2.5 px-4 text-gray-600">{item.ownerName}</td>
                <td className="py-2.5 px-4 text-right"><ArrowRight className="w-3.5 h-3.5 text-gray-400 inline-block" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
