import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  PhoneCall,
  Edit,
  Trash2,
  ChevronRight,
  Eye,
  Building,
  CheckSquare,
  Square,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Tag
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Lead, LeadStatus, LeadPriority } from '../../types';

interface LeadsListViewProps {
  onSelectLead: (leadId: string) => void;
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
  onEditLead: (lead: Lead) => void;
  onRecordCall: (lead: Lead) => void;
}

export const LeadsListView: React.FC<LeadsListViewProps> = ({
  onSelectLead,
  onOpenCreateModal,
  onOpenImportModal,
  onEditLead,
  onRecordCall
}) => {
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.getLeads({
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setLeads(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalCount(res.pagination.total || 0);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, priorityFilter, sortBy, sortOrder, currentPage, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLeads();
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete lead for ${name}?`)) return;
    try {
      await api.deleteLead(id);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Lead ID', 'Customer Name', 'Company', 'Phone', 'Email', 'Products', 'Status', 'Priority', 'Value (INR)', 'Assigned To'];
    const rows = leads.map(l => [
      l.leadIdNumber,
      `"${l.customerName}"`,
      `"${l.companyName}"`,
      l.phone,
      l.email,
      `"${l.productInterests?.join(', ') || ''}"`,
      l.leadStatus,
      l.priority,
      l.leadValue,
      `"${l.assignedTelecallerName || l.assignedTeamLeadName || 'Unassigned'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `om_jyoti_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">New</span>;
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Contacted</span>;
      case 'interested':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Interested</span>;
      case 'qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Qualified</span>;
      case 'converted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Converted</span>;
      case 'lost':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Lost</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 capitalize">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">HIGH</span>;
      case 'medium':
        return <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">MED</span>;
      case 'low':
        return <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">LOW</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Top Header & Quick Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Leads Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {user?.role === 'telecaller'
              ? 'Your assigned customer inquiries and active conversion pipeline.'
              : 'Track, assign, and convert industrial water & wastewater system opportunities.'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            id="leads-export-csv-btn"
            onClick={exportCSV}
            className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            id="leads-import-csv-btn"
            onClick={onOpenImportModal}
            className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import</span>
          </button>

          <button
            id="leads-create-lead-btn"
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="leads-search-input"
              type="text"
              placeholder="Search by customer name, company, phone or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-lg text-xs transition-all focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 flex-wrap">
            {/* Priority Filter */}
            <select
              id="filter-priority-select"
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Sort Dropdown */}
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none"
            >
              <option value="createdAt">Date Created</option>
              <option value="leadValue">Lead Value</option>
              <option value="customerName">Customer Name</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600"
              title="Toggle Sort Direction"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>

            <button
              type="button"
              onClick={fetchLeads}
              className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Status Filter Chips matching Image 5.png */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'new', label: 'New' },
            { id: 'contacted', label: 'Contacted' },
            { id: 'interested', label: 'Interested' },
            { id: 'qualified', label: 'Qualified' },
            { id: 'converted', label: 'Converted' },
            { id: 'lost', label: 'Lost' }
          ].map(chip => (
            <button
              key={chip.id}
              id={`filter-chip-${chip.id}`}
              onClick={() => {
                setStatusFilter(chip.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === chip.id
                  ? 'bg-[#00288e] text-white shadow-xs'
                  : 'bg-gray-100/80 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Items Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#00288e]">
            <CheckSquare className="w-4 h-4" />
            <span>{selectedLeadIds.length} leads selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-2.5 py-1 text-xs text-gray-600 hover:bg-white rounded-md font-medium"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#00288e] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Retrieving engineering leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No leads found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query or filter chips.'
                : 'Get started by creating a new lead or importing a batch via CSV.'}
            </p>
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-[#00288e] text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Lead</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button onClick={handleSelectAll} className="p-1 text-gray-400 hover:text-gray-600">
                      {selectedLeadIds.length === leads.length && leads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#00288e]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Lead ID & Customer</th>
                  <th className="py-3 px-4">Company & Location</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {leads.map(lead => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-gray-50/90 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                      onClick={() => onSelectLead(lead.id)}
                    >
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(lead.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#00288e]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-gray-400 font-mono">{lead.leadIdNumber}</span>
                          <span className="font-bold text-gray-900">{lead.customerName}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 space-x-2 mt-0.5">
                          <span>{lead.phone}</span>
                          {lead.email && <span>• {lead.email}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 font-medium text-gray-800">
                          <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{lead.companyName || 'Individual'}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block mt-0.5">{lead.location}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(lead.productInterests || ['STP Plant']).map((p, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium truncate max-w-[120px]"
                              title={p}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                        {formatINR(lead.leadValue)}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(lead.leadStatus)}
                      </td>

                      <td className="py-3 px-4">
                        {getPriorityBadge(lead.priority)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-[#00288e] text-[10px] font-bold flex items-center justify-center">
                            {(lead.assignedTelecallerName || lead.assignedTeamLeadName || 'U').substring(0, 1)}
                          </div>
                          <span className="text-gray-700 font-medium">
                            {lead.assignedTelecallerName || lead.assignedTeamLeadName || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            id={`call-lead-btn-${lead.id}`}
                            onClick={() => onRecordCall(lead)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Log Call"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`edit-lead-btn-${lead.id}`}
                            onClick={() => onEditLead(lead)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="Edit Lead"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {hasPermission('leads:all') && (
                            <button
                              id={`delete-lead-btn-${lead.id}`}
                              onClick={() => handleDeleteLead(lead.id, lead.customerName)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            id={`view-details-btn-${lead.id}`}
                            onClick={() => onSelectLead(lead.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-700">{leads.length}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalCount}</span> total leads
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="font-semibold text-gray-700 px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
