import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, PhoneCall, PackageCheck, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import { DIVISIONS, Division, NEW_SALES_STAGES, SERVICE_STAGES } from '../../types';
import { PipelineLeadDetailView } from './PipelineLeadDetailView';

const AGEING_FLAG_HOURS = 72;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');

function ageingHours(stageEnteredAt: string): number {
  return (Date.now() - new Date(stageEnteredAt).getTime()) / 3600000;
}

// Screens 03/04 — Executive dashboard + reports & ageing: a consolidated,
// read-only view for management, filterable by division, without touching
// operational records.
export const PipelineDashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<{ due: any[]; overdue: any[]; upcoming: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState<'all' | Division>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [leadsRes, ordersRes, fuRes] = await Promise.all([
          api.getPipelineLeads({}),
          api.getPipelineOrders(),
          api.getFollowUpDashboard()
        ]);
        setLeads(leadsRes.leads);
        setOrders(ordersRes.orders);
        setFollowUps(fuRes);
      } catch (err) {
        console.error('Failed to load pipeline dashboard', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredLeads = useMemo(() => divisionFilter === 'all' ? leads : leads.filter(l => l.division === divisionFilter), [leads, divisionFilter]);

  const newSalesLeads = filteredLeads.filter(l => l.leadType === 'new_sales');
  const serviceLeads = filteredLeads.filter(l => l.leadType === 'service');
  const ageingFlagged = filteredLeads.filter(l => ageingHours(l.stageEnteredAt) > AGEING_FLAG_HOURS);
  const ordersPendingApproval = orders.filter((o: any) => o.status === 'punched');
  const executionAtRisk = orders.filter((o: any) => o.status === 'approved'); // approved orders mid-execution

  const funnel = (stages: { id: string; label: string }[], list: any[]) => stages.map(s => ({ ...s, count: list.filter(l => l.stage === s.id).length }));
  const newSalesFunnel = funnel(NEW_SALES_STAGES, newSalesLeads);
  const serviceFunnel = funnel(SERVICE_STAGES, serviceLeads);
  const maxFunnelCount = Math.max(1, ...newSalesFunnel.map(f => f.count), ...serviceFunnel.map(f => f.count));

  if (selectedLeadId) {
    return <PipelineLeadDetailView leadId={selectedLeadId} onBack={() => setSelectedLeadId(null)} />;
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Loading dashboard...</div>;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pipeline Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Leads by type, overdue follow-ups, orders pending approval, execution at risk — read-only.</p>
        </div>
        <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value as any)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
          <option value="all">All Divisions</option>
          {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="New Sales Leads" value={newSalesLeads.length} color="blue" onClick={() => onNavigate('pipeline')} />
        <StatCard icon={TrendingUp} label="Service Leads" value={serviceLeads.length} color="amber" onClick={() => onNavigate('pipeline')} />
        <StatCard icon={AlertTriangle} label="Ageing Flagged" value={ageingFlagged.length} color="red" onClick={() => onNavigate('pipeline')} />
        <StatCard icon={PhoneCall} label="Overdue Follow-ups" value={followUps?.overdue.length || 0} color="red" onClick={() => onNavigate('followups')} />
        <StatCard icon={PackageCheck} label="Orders Pending Approval" value={ordersPendingApproval.length} color="amber" onClick={() => onNavigate('approvals')} />
        <StatCard icon={PackageCheck} label="In Execution" value={executionAtRisk.length} color="blue" onClick={() => onNavigate('approvals')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelCard title="New Sales Funnel" funnel={newSalesFunnel} max={maxFunnelCount} color="bg-[#00288e]" />
        <FunnelCard title="Service Sales Funnel" funnel={serviceFunnel} max={maxFunnelCount} color="bg-amber-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900">Stage Ageing — Leads Stuck Too Long</h3>
          <span className="text-[10px] text-gray-400">Flag threshold: {AGEING_FLAG_HOURS}h in current stage</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold">
            <tr><th className="py-2.5 px-4">Lead</th><th className="py-2.5 px-4">Division</th><th className="py-2.5 px-4">Stage</th><th className="py-2.5 px-4">Entered Stage</th><th className="py-2.5 px-4">Owner</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ageingFlagged.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No ageing flags right now.</td></tr>}
            {ageingFlagged.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLeadId(l.id)}>
                <td className="py-2.5 px-4"><span className="font-mono text-[10px] font-bold text-gray-400">{l.leadNumber}</span><p className="font-bold text-gray-900">{l.customerName}</p></td>
                <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-medium text-[11px]">{l.division}</span></td>
                <td className="py-2.5 px-4 capitalize">{l.stage.replace(/_/g, ' ')}</td>
                <td className="py-2.5 px-4 text-red-600 font-semibold">{fmtDate(l.stageEnteredAt)} ({Math.round(ageingHours(l.stageEnteredAt) / 24)}d)</td>
                <td className="py-2.5 px-4 text-gray-600">{l.ownerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue: { bg: 'hover:bg-blue-50', text: 'text-[#00288e]', iconBg: 'bg-blue-50' },
  amber: { bg: 'hover:bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-50' },
  red: { bg: 'hover:bg-red-50', text: 'text-red-600', iconBg: 'bg-red-50' }
};

const StatCard: React.FC<{ icon: any; label: string; value: number; color: 'blue' | 'amber' | 'red'; onClick: () => void }> = ({ icon: Icon, label, value, color, onClick }) => {
  const c = COLOR_CLASSES[color];
  return (
    <button onClick={onClick} className={`bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-left transition-colors ${c.bg}`}>
      <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${c.text}`} /></div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      <p className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</p>
    </button>
  );
};

const FunnelCard: React.FC<{ title: string; funnel: { id: string; label: string; count: number }[]; max: number; color: string }> = ({ title, funnel, max, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5">
    <h3 className="font-bold text-sm text-gray-900 mb-3">{title}</h3>
    <div className="space-y-2">
      {funnel.map(f => (
        <div key={f.id} className="flex items-center space-x-2 text-xs">
          <span className="w-40 text-gray-600 truncate">{f.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: `${(f.count / max) * 100}%` }} />
          </div>
          <span className="w-6 text-right font-bold text-gray-900">{f.count}</span>
        </div>
      ))}
    </div>
  </div>
);
