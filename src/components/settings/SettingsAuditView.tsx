import React, { useState, useEffect } from 'react';
import {
  Shield,
  History,
  Building,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Save
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ActivityLog } from '../../types';

export const SettingsAuditView: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'roles' | 'organization' | 'system'>('audit');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [logError, setLogError] = useState<string | null>(null);

  // Organization settings
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setLogError(null);
    try {
      const [logsRes, healthRes] = await Promise.all([
        api.getActivityLogs({ search: search || undefined, limit: 30 }),
        api.getHealth()
      ]);
      setLogs(logsRes?.logs || []);
      setHealthStatus(healthRes);
    } catch (err: any) {
      console.error('Failed to load logs:', err);
      setLogError(err.message || 'Unable to retrieve audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await api.getSettings();
      setSettings(res.settings || {});
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveOrganizationSettings = async () => {
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      const keys = ['company_name', 'company_phone', 'company_email', 'company_address', 'company_gstin', 'company_pan', 'company_msme_udyam'];
      for (const key of keys) {
        await api.updateSetting(key, settings[key] ?? '');
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save organization settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Settings & Administration</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Role-based security governance, company profile, compliance parameters, and immutable CRM event trails.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'audit', label: 'Activity Audit Trail', icon: History },
          { id: 'roles', label: 'Role & Permission Matrix', icon: Shield },
          { id: 'organization', label: 'Company Profile & Tax IDs', icon: Building },
          { id: 'system', label: 'Server Status & APIs', icon: Server }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeSubTab === tab.id
                  ? 'bg-[#00288e] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter logs by user, action, or entity..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
              />
            </div>
            <button
              onClick={fetchLogs}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-xs flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {logError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{logError}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action Summary</th>
                    <th className="py-3 px-4">Target Entity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No activity records found
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt || (log as any).timestamp || Date.now()).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {log.userName || (log as any).actorName || 'System'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#00288e]">
                            {(log.userRole || (log as any).actorRole || 'admin').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-800">{log.action}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                          {log.entityType ? `${log.entityType} (${log.entityId || 'N/A'})` : 'System'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ROLES MATRIX */}
      {activeSubTab === 'roles' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Role-Based Access Control (RBAC) Architecture</h3>
            <p className="text-xs text-gray-500">Om Jyoti Engineering permission segregation table.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Leads Visibility</th>
                  <th className="py-3 px-4">Employee Management</th>
                  <th className="py-3 px-4">Inventory Operations</th>
                  <th className="py-3 px-4">Audit Logs & Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Super Admin</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">Full Unrestricted (All Leads)</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">Create / Edit / Deactivate / Roles</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">Full CRUD & Price Changes</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">Full Audit & System Logs</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Team Lead</td>
                  <td className="py-3 px-4 text-gray-700">Team Leads + Assign / Reallocate</td>
                  <td className="py-3 px-4 text-gray-500">View Team Performance</td>
                  <td className="py-3 px-4 text-gray-700">View Stock Availability</td>
                  <td className="py-3 px-4 text-gray-700">View Team Activity</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Telecaller</td>
                  <td className="py-3 px-4 text-gray-700">Assigned Leads Only + Call Logging</td>
                  <td className="py-3 px-4 text-gray-400">No Access</td>
                  <td className="py-3 px-4 text-gray-700">View Product Catalog</td>
                  <td className="py-3 px-4 text-gray-400">No Access</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Operations Manager</td>
                  <td className="py-3 px-4 text-gray-700">Read All Leads & Quotes</td>
                  <td className="py-3 px-4 text-gray-500">Read-Only Employee List</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">Full Inventory & Supplier POs</td>
                  <td className="py-3 px-4 text-gray-700">Stock & Order Analytics</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Data Entry Operator</td>
                  <td className="py-3 px-4 text-gray-700">Import CSV & Create Unassigned Leads</td>
                  <td className="py-3 px-4 text-gray-400">No Access</td>
                  <td className="py-3 px-4 text-gray-400">No Access</td>
                  <td className="py-3 px-4 text-gray-400">No Access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORGANIZATION DETAILS */}
      {activeSubTab === 'organization' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00288e] flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Company Profile</h3>
              <p className="text-xs text-gray-500">Shown on quotations, invoices and delivery challans. Edit and save to update them.</p>
            </div>
          </div>

          {settingsLoading ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Company Name</label>
                  <input value={settings.company_name || ''} onChange={e => setSettings(s => ({ ...s, company_name: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Phone</label>
                  <input value={settings.company_phone || ''} onChange={e => setSettings(s => ({ ...s, company_phone: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Email</label>
                  <input value={settings.company_email || ''} onChange={e => setSettings(s => ({ ...s, company_email: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Address</label>
                  <input value={settings.company_address || ''} onChange={e => setSettings(s => ({ ...s, company_address: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">GSTIN</label>
                  <input value={settings.company_gstin || ''} onChange={e => setSettings(s => ({ ...s, company_gstin: e.target.value }))} placeholder="Not set" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">PAN</label>
                  <input value={settings.company_pan || ''} onChange={e => setSettings(s => ({ ...s, company_pan: e.target.value }))} placeholder="Not set" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">MSME Udyam Number</label>
                  <input value={settings.company_msme_udyam || ''} onChange={e => setSettings(s => ({ ...s, company_msme_udyam: e.target.value }))} placeholder="Not set" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                {settingsSaved && <span className="text-xs text-emerald-600 font-semibold">Saved</span>}
                <button onClick={saveOrganizationSettings} disabled={settingsSaving} className="px-4 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" />
                  <span>{settingsSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* SYSTEM STATUS */}
      {activeSubTab === 'system' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">API Server Status</h3>
              <p className="text-xs text-gray-500">Om Jyoti Engineering CRM backend</p>
            </div>
            <span className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${healthStatus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{healthStatus ? 'Operational' : 'Checking...'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-400 font-semibold block">Runtime Environment</span>
              <span className="font-mono font-bold text-gray-900 mt-1 block">Node.js Express + TSX</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-400 font-semibold block">Active User Session</span>
              <span className="font-mono font-bold text-[#00288e] mt-1 block">{user?.email} ({user?.role})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
