import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Plus,
  Search,
  Shield,
  Phone,
  Mail,
  Award,
  TrendingUp,
  BarChart2,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Team, UserRole } from '../../types';

export const EmployeesView: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [perfModalEmployee, setPerfModalEmployee] = useState<{ employee: User; performance: any } | null>(null);

  // New employee form
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('telecaller');
  const [newTeamId, setNewTeamId] = useState('');
  const [newDesignation, setNewDesignation] = useState('Inside Sales Engineer');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, teamRes] = await Promise.all([
        api.getEmployees({ role: roleFilter !== 'all' ? roleFilter : undefined, search: search || undefined }),
        api.getTeams()
      ]);
      setEmployees(empRes.employees);
      setTeams(teamRes.teams);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter, search]);

  const handleOpenPerformance = async (emp: User) => {
    try {
      const res = await api.getEmployeeById(emp.id);
      setPerfModalEmployee(res);
    } catch (err: any) {
      alert('Failed to load performance metrics: ' + err.message);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newFirstName.trim() || !newEmail.trim()) {
      setFormError('First name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createEmployee({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        role: newRole,
        teamId: newTeamId || undefined,
        designation: newDesignation.trim(),
        department: 'Sales & Engineering'
      });
      setCreateModalOpen(false);
      // Reset form
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPhone('');
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Employees & Team Hierarchy</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Role-based access management, team allocations, and telecaller sales metrics.
          </p>
        </div>

        {hasPermission('employees:all') && (
          <button
            id="add-employee-btn"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Employee</span>
          </button>
        )}
      </div>

      {/* Teams Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#00288e] flex items-center justify-center font-bold text-xs">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{team.name}</h3>
                  <p className="text-[11px] text-gray-500">Team Lead: <strong className="text-gray-800">{team.teamLeadName}</strong></p>
                </div>
              </div>
              <span className="text-xs bg-blue-100/80 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                {(team.members || []).length} Members
              </span>
            </div>

            <p className="text-xs text-gray-600">{team.description}</p>

            <div className="pt-2 border-t border-gray-100 flex items-center space-x-2">
              <div className="flex -space-x-2">
                {(team.members || []).map((m, i) => (
                  <img
                    key={m.id || i}
                    src={m.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={m.firstName}
                    title={`${m.firstName} ${m.lastName} (${m.role})`}
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-400 pl-2">Active sales coverage</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee by name, email, or designation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00288e]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 w-full sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="team_lead">Team Lead</option>
          <option value="telecaller">Telecaller</option>
          <option value="manager">Operations Manager</option>
          <option value="data_entry_operator">Data Entry Operator</option>
        </select>
      </div>

      {/* Employees Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={emp.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={emp.firstName}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-gray-100"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{emp.firstName} {emp.lastName}</h3>
                    <p className="text-[11px] text-gray-500">{emp.designation}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-[#00288e] border border-blue-200 rounded-md text-[10px] font-bold capitalize">
                      {emp.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{emp.phone}</span>
                </div>
                {emp.teamName && (
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-800 font-medium">{emp.teamName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>

              <button
                onClick={() => handleOpenPerformance(emp)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-[#00288e] border border-gray-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Performance</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-base font-bold text-gray-900">Add New CRM User / Employee</h2>
                <p className="text-xs text-gray-500">Configure role permissions and team assignment</p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={e => setNewFirstName(e.target.value)}
                    placeholder="e.g. Vikas"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={e => setNewLastName(e.target.value)}
                    placeholder="e.g. Mehta"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="name@omjyotiengg.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  >
                    <option value="telecaller">Telecaller</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="manager">Operations Manager</option>
                    <option value="data_entry_operator">Data Entry Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assign to Team</label>
                  <select
                    value={newTeamId}
                    onChange={e => setNewTeamId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  >
                    <option value="">No Team / Independent</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={newDesignation}
                  onChange={e => setNewDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-500">
                Default password for new account will be <strong>pass@123</strong>. The employee will be prompted to reset upon first login.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Performance Drilldown Modal */}
      {perfModalEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={perfModalEmployee.employee.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={perfModalEmployee.employee.firstName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    {perfModalEmployee.employee.firstName} {perfModalEmployee.employee.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">{perfModalEmployee.employee.role.replace('_', ' ')} • {perfModalEmployee.employee.department}</p>
                </div>
              </div>
              <button onClick={() => setPerfModalEmployee(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-[11px] font-semibold text-gray-500 block">Assigned Leads</span>
                <span className="text-xl font-bold text-gray-900">{perfModalEmployee.performance.leads_assigned}</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[11px] font-semibold text-gray-500 block">Conversions (Won)</span>
                <span className="text-xl font-bold text-emerald-700">{perfModalEmployee.performance.conversions}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[11px] font-semibold text-gray-500 block">Calls Completed</span>
                <span className="text-xl font-bold text-gray-900">{perfModalEmployee.performance.calls_made}</span>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-[11px] font-semibold text-gray-500 block">Conversion Rate</span>
                <span className="text-xl font-bold text-indigo-700">{perfModalEmployee.performance.conversion_rate}%</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl">
              <span className="text-xs text-blue-200 block font-medium">Total Revenue Closed</span>
              <span className="text-2xl font-bold">{formatINR(perfModalEmployee.performance.total_revenue_generated)}</span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPerfModalEmployee(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
