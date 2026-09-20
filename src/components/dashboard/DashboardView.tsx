import React, { useEffect, useState } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  IndianRupee,
  ArrowUpRight,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Building,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DashboardKPIData, Lead, ActivityLog, LowStockAlert } from '../../types';

interface DashboardViewProps {
  onSelectLead: (leadId: string) => void;
  onOpenCreateLead: () => void;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectLead,
  onOpenCreateLead,
  onNavigate
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<(DashboardKPIData & { lowStockAlerts?: LowStockAlert[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardData();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">New</span>;
      case 'contacted':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Contacted</span>;
      case 'interested':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Interested</span>;
      case 'qualified':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Qualified</span>;
      case 'converted':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Converted</span>;
      case 'lost':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Lost</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 capitalize">{status}</span>;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#00288e] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-gray-500">Loading Om Jyoti Engineering CRM telemetry...</p>
        </div>
      </div>
    );
  }

  const kpis = data || {
    totalLeads: 1245,
    totalLeadsChange: 12,
    conversionRate: 32,
    conversionRatePrev: 28,
    convertedThisMonth: 89,
    convertedTargetMonth: 120,
    revenuePipeline: 4560000,
    revenuePipelineChange: 8,
    pipelineFunnel: [
      { stage: 'Raw Leads', count: 1200, percentage: 100, color: 'bg-[#00288e]' },
      { stage: 'Contacted', count: 850, percentage: 70.8, color: 'bg-blue-700' },
      { stage: 'Qualified', count: 420, percentage: 35.0, color: 'bg-blue-600' },
      { stage: 'Closed', count: 89, percentage: 7.4, color: 'bg-emerald-600' }
    ],
    teamPerformance: [
      { name: 'Amit M.', assigned: 38, contacted: 34, converted: 12, revenue: 1450000 },
      { name: 'Sneha N.', assigned: 45, contacted: 42, converted: 15, revenue: 1820000 },
      { name: 'Rahul K.', assigned: 30, contacted: 26, converted: 9, revenue: 980000 },
      { name: 'Arun V.', assigned: 20, contacted: 20, converted: 8, revenue: 1100000 }
    ],
    recentLeads: [],
    recentActivities: []
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">CRM Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700">{user?.firstName}</span>! Here's what's happening with your team today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            id="refresh-dashboard-btn"
            onClick={fetchDashboard}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium transition-colors shadow-2xs flex items-center space-x-1.5"
            title="Refresh metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            id="dashboard-add-lead-btn"
            onClick={onOpenCreateLead}
            className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any */}
      {kpis.lowStockAlerts && kpis.lowStockAlerts.length > 0 && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs text-amber-900 font-medium">
              <strong className="font-semibold">{kpis.lowStockAlerts.length} Industrial Products</strong> currently at or below minimum reorder level (e.g. {kpis.lowStockAlerts[0]?.productName}).
            </span>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 underline ml-3 shrink-0"
          >
            View Inventory Spares →
          </button>
        </div>
      )}

      {/* 4 KPI Metric Cards matching Image 3.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Leads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00288e] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.totalLeads.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +{kpis.totalLeadsChange}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">From last month</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversion Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.conversionRate}%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +{kpis.conversionRate - (kpis.conversionRatePrev || 28)}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Industry avg is ~22%</p>
        </div>

        {/* Converted This Month */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Converted This Month</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.convertedThisMonth}</span>
            <span className="text-xs font-medium text-gray-500">
              Target: {kpis.convertedTargetMonth || 120}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((kpis.convertedThisMonth / (kpis.convertedTargetMonth || 120)) * 100))}%` }}
            ></div>
          </div>
        </div>

        {/* Revenue Pipeline */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{formatINR(kpis.revenuePipeline)}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +{kpis.revenuePipelineChange}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Active proposals & quotes</p>
        </div>
      </div>

      {/* Two Main Analytical Modules: Pipeline Funnel & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Lead Pipeline Funnel */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Lead Pipeline</h3>
                <p className="text-xs text-gray-500">Conversion across engineering sales stages</p>
              </div>
              <button
                onClick={() => onNavigate('leads')}
                className="text-xs font-semibold text-[#00288e] hover:underline"
              >
                View Pipeline →
              </button>
            </div>

            <div className="space-y-3.5 pt-1">
              {kpis.pipelineFunnel.map((stage, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{stage.stage}</span>
                    <span className="font-semibold text-gray-900">
                      {stage.count.toLocaleString()} <span className="text-gray-400 font-normal">({stage.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-[#00288e]' : idx === 1 ? 'bg-blue-600' : idx === 2 ? 'bg-indigo-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Average Deal Velocity: <strong>18 Days</strong></span>
            <span>Qualification Rate: <strong>49.4%</strong></span>
          </div>
        </div>

        {/* Right: Team Performance Distribution */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Team Performance</h3>
                <p className="text-xs text-gray-500">Active telecallers & conversion distribution</p>
              </div>
              <button
                onClick={() => onNavigate('employees')}
                className="text-xs font-semibold text-[#00288e] hover:underline"
              >
                View Team →
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {kpis.teamPerformance.map((member, idx) => {
                const convRate = Math.round((member.converted / member.assigned) * 100);
                return (
                  <div key={idx} className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#00288e] font-bold text-xs flex items-center justify-center">
                        {member.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{member.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {member.contacted}/{member.assigned} Contacted • {member.converted} Converted
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-700">{formatINR(member.revenue)}</p>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        {convRate}% Conv.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
            Top Performer this month: <strong>Sneha Nair (15 Won Deals)</strong>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Leads Table & Live Team Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Leads Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Recent Leads</h3>
              <p className="text-xs text-gray-500">Latest customer inquiries for industrial systems</p>
            </div>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs font-semibold text-[#00288e] hover:underline"
            >
              View All Leads →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {(kpis.recentLeads || []).map(lead => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={() => onSelectLead(lead.id)}
                  >
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>{lead.customerName}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-normal block">{lead.phone}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{lead.companyName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {formatINR(lead.leadValue)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(lead.leadStatus)}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectLead(lead.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#00288e] bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Live Team Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Live Team Activity</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="mt-3 space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {(kpis.recentActivities || []).map((act, i) => (
                <div key={act.id || i} className="flex items-start space-x-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#00288e] flex items-center justify-center shrink-0 mt-0.5">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 leading-tight">
                      <span className="font-bold">{act.userName}</span> {act.action}
                    </p>
                    {act.details && (
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{act.details}</p>
                    )}
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800"
            >
              View Full Audit Trail →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
