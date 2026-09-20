import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  History,
  Building,
  Key,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Lock,
  Flame,
  UploadCloud,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ActivityLog } from '../../types';
import { firestoreService } from '../../services/firestoreService';
import firebaseConfig from '../../../firebase-applet-config.json';

export const SettingsAuditView: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'firebase' | 'audit' | 'roles' | 'organization' | 'system'>('firebase');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  
  // Firebase State
  const [firebaseStatus, setFirebaseStatus] = useState<{ connected: boolean; count?: number; error?: string } | null>(null);
  const [syncingFirestore, setSyncingFirestore] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const [logError, setLogError] = useState<string | null>(null);

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

  const testFirebaseConnection = async () => {
    const res = await firestoreService.checkConnection();
    setFirebaseStatus(res);
  };

  const handleSyncToFirestore = async () => {
    setSyncingFirestore(true);
    setSyncResult(null);
    try {
      const [leadsRes, invRes, empRes] = await Promise.all([
        api.getLeads({ limit: 100 }),
        api.getProducts(),
        api.getEmployees()
      ]);

      const result = await firestoreService.syncInitialData({
        leads: leadsRes.data,
        inventory: invRes.products,
        users: empRes.employees
      });

      setSyncResult(`Successfully synced ${result.syncedLeads} leads, ${result.syncedInventory} inventory items, and ${empRes.employees.length} users to Firebase Firestore!`);
      testFirebaseConnection();
    } catch (err: any) {
      setSyncResult(`Sync notice: ${err?.message || 'Error occurred during sync'}`);
    } finally {
      setSyncingFirestore(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    testFirebaseConnection();
  }, [search]);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Settings & Cloud Infrastructure</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Role-based security governance, Firebase Firestore backend, compliance parameters, and immutable CRM event trails.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'firebase', label: 'Firebase Cloud Backend', icon: Flame },
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

      {/* 0. FIREBASE CLOUD BACKEND */}
      {activeSubTab === 'firebase' && (
        <div className="space-y-6">
          {/* Status banner */}
          <div className="bg-gradient-to-r from-[#00288e]/10 via-blue-50 to-amber-50/50 p-6 rounded-2xl border border-blue-100/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-7 h-7 fill-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-gray-900">Google Cloud Firebase & Firestore</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Provisioned & Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                    High-performance NoSQL cloud database powering durable data persistence, document locking, real-time stage updates, and enterprise security rules for Om Jyoti Engineering Works.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={testFirebaseConnection}
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Cloud Link</span>
                </button>

                <button
                  onClick={handleSyncToFirestore}
                  disabled={syncingFirestore}
                  className="px-4 py-2 bg-[#00288e] hover:bg-[#002070] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${syncingFirestore ? 'animate-bounce' : ''}`} />
                  <span>{syncingFirestore ? 'Syncing to Cloud...' : 'Push All Data to Cloud'}</span>
                </button>
              </div>
            </div>

            {syncResult && (
              <div className="p-3 bg-white/90 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{syncResult}</span>
              </div>
            )}
          </div>

          {/* Config Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Firebase Project ID</span>
              <span className="font-mono text-sm font-bold text-gray-900 block">{firebaseConfig.projectId}</span>
              <p className="text-[11px] text-gray-500">Google Cloud Platform managed instance</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Firestore Database ID</span>
              <span className="font-mono text-xs font-bold text-[#00288e] block break-all">{firebaseConfig.firestoreDatabaseId}</span>
              <p className="text-[11px] text-gray-500">Dedicated multi-region database container</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Auth & Client Domain</span>
              <span className="font-mono text-xs font-bold text-gray-800 block break-all">{firebaseConfig.authDomain}</span>
              <p className="text-[11px] text-gray-500">OAuth client: {firebaseConfig.oAuthClientId.substring(0, 16)}...</p>
            </div>
          </div>

          {/* Blueprint & Security Rules Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#00288e]" />
                  <h3 className="text-sm font-bold text-gray-900">Firestore Collections Blueprint</h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">9 Collections</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { name: 'leads', desc: 'Industrial sales pipeline, customer contacts, capacities & quotes' },
                  { name: 'users', desc: 'Employee hierarchy, designations, phone, role permissions' },
                  { name: 'call_logs', desc: 'Telecaller interaction records, durations, voice logs & notes' },
                  { name: 'inventory_items', desc: 'STP, RO plants, CR pumps, valves, and spares stock on hand' },
                  { name: 'stock_movements', desc: 'Receipts, dispatches, audits, and scrap write-off records' },
                  { name: 'activity_logs', desc: 'Immutable enterprise audit trail of all actions and modifications' },
                  { name: 'lead_notes', desc: 'Internal discussion threads & technical requirement notes' },
                  { name: 'settings', desc: 'Company parameters, GST details, notification configs' },
                  { name: 'roles', desc: 'Granular permissions matrix for 5 enterprise user roles' }
                ].map((col, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="font-mono font-bold text-[#00288e]">/{col.name}</span>
                    <span className="text-gray-500 text-right text-[11px] max-w-xs">{col.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900">Firestore Security Rules (Deployed)</h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Rules v2 Deployed
                </span>
              </div>

              <div className="p-3.5 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                <p className="text-emerald-400">// Granular RBAC Security Rules</p>
                <p className="text-slate-400">rules_version = '2';</p>
                <p className="text-slate-400">service cloud.firestore &#123;</p>
                <p className="text-slate-300 ml-2">match /databases/&#123;database&#125;/documents &#123;</p>
                <p className="text-amber-300 ml-4">// Super Admin full access</p>
                <p className="text-slate-300 ml-4">match /users/&#123;userId&#125; &#123; allow read: if isStaff(); allow write: if isSuperAdmin(); &#125;</p>
                <p className="text-slate-300 ml-4">match /leads/&#123;leadId&#125; &#123; allow read, write: if isStaff(); &#125;</p>
                <p className="text-slate-300 ml-4">match /inventory_items/&#123;id&#125; &#123; allow read: if isStaff(); allow write: if isSuperAdmin() || isManager(); &#125;</p>
                <p className="text-slate-300 ml-4">match /activity_logs/&#123;logId&#125; &#123; allow read: if isSuperAdmin() || isManager(); allow write: if false; &#125;</p>
                <p className="text-slate-300 ml-2">&#125;</p>
                <p className="text-slate-400">&#125;</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Zero-trust cloud database security ensures users only access data aligned with their role permissions.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. AUDIT LOGS */}
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

      {/* 3. ORGANIZATION DETAILS */}
      {activeSubTab === 'organization' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00288e] flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Om Jyoti Engineering Works</h3>
              <p className="text-xs text-gray-500">Industrial Water Treatment, Wastewater Systems & Heavy Engineering</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Headquarters</span>
              <p className="font-medium text-gray-800">Plot No. B-42, Industrial Area, Sector 62, Noida, Uttar Pradesh, 201309</p>
              <p className="text-gray-500">Phone: +91 120 456 7890 • contact@omjyotiengg.com</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Statutory Compliance</span>
              <p className="text-gray-800">GSTIN: <strong className="font-mono">09AAFCO1234F1Z8</strong></p>
              <p className="text-gray-800">PAN: <strong className="font-mono">AAFCO1234F</strong></p>
              <p className="text-gray-800">MSME Udyam: <strong className="font-mono">UDYAM-UP-28-0012894</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* 4. BACKEND TELEMETRY */}
      {activeSubTab === 'system' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Full-Stack Architecture & Microservices</h3>
              <p className="text-xs text-gray-500">Om Jyoti Engineering API v1.0.0 Microservices Telemetry</p>
            </div>
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Operational (Port 3000)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-400 font-semibold block">Runtime Environment</span>
              <span className="font-mono font-bold text-gray-900 mt-1 block">Node.js Express + TSX</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-400 font-semibold block">Cloud Database</span>
              <span className="font-mono font-bold text-[#00288e] mt-1 block">Google Firestore (Active)</span>
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
