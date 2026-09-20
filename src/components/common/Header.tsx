import React, { useState } from 'react';
import {
  Search,
  Bell,
  UserCheck,
  Shield,
  LogOut,
  ChevronDown,
  PhoneCall,
  CheckCircle,
  AlertTriangle,
  Building2,
  RefreshCw,
  Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface HeaderProps {
  activeTab?: string;
  onSearchChange?: (val: string) => void;
  onOpenCreateLead?: () => void;
  onNavigate?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSearchChange,
  onOpenCreateLead,
  onNavigate,
  onToggleMobileMenu
}) => {
  const { user, logout, switchRoleQuick } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const rolesList: { id: UserRole; title: string; desc: string }[] = [
    { id: 'super_admin', title: 'Super Admin', desc: 'admin@omjyotiengg.com (Full Access)' },
    { id: 'team_lead', title: 'Team Lead', desc: 'lead@omjyotiengg.com (North Sales)' },
    { id: 'telecaller', title: 'Telecaller', desc: 'caller@omjyotiengg.com (Assigned Leads)' },
    { id: 'manager', title: 'Operations Manager', desc: 'manager@omjyotiengg.com (Supervision)' },
    { id: 'data_entry_operator', title: 'Data Entry Operator', desc: 'data@omjyotiengg.com (Import & Validation)' }
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center space-x-3 flex-1 max-w-lg">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Building2 className="w-5 h-5" />
          </button>
        )}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-header-search"
            type="text"
            placeholder="Search leads, phone, company or products (e.g. STP, RO)..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#00288e]/20"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Firebase Cloud Status Pill */}
        <button
          onClick={() => onNavigate && onNavigate('settings')}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
          title="Google Cloud Firestore Backend Active"
        >
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
          <span className="text-[11px] font-bold">Firestore Cloud</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            id="role-quick-switcher-btn"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00288e] border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
            title="Switch user role for demo testing"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Switch Role View</p>
                <p className="text-xs text-gray-500">Test role-based permissions</p>
              </div>
              <div className="py-1">
                {rolesList.map(r => (
                  <button
                    key={r.id}
                    id={`role-switch-${r.id}`}
                    onClick={() => {
                      switchRoleQuick(r.id);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      user?.role === r.id ? 'bg-blue-50/70 font-semibold text-[#00288e]' : 'text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="capitalize">{r.title}</span>
                        {user?.role === r.id && <span className="w-1.5 h-1.5 rounded-full bg-[#00288e]"></span>}
                      </div>
                      <span className="text-[11px] text-gray-400 block font-normal">{r.desc}</span>
                    </div>
                    {user?.role === r.id && <CheckCircle className="w-4 h-4 text-[#00288e]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="notifications-toggle-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative transition-colors"
            title="System notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Live System Alerts</h4>
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">3 New</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate && onNavigate('inventory')}>
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">Low Stock Alert: RO Plant 5000 LPH</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Quantity on hand (2) below reorder level (3).</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">10 minutes ago</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate && onNavigate('leads')}>
                  <div className="flex items-start space-x-2.5">
                    <PhoneCall className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">Call Logged: Rajesh Kumar</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Amit Mishra logged 420s call regarding STP 100 KLD.</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate && onNavigate('leads')}>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-900">New High Priority Lead</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">TechBuild India (₹8,50,000) assigned to North Sales.</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">4 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
          <img
            src={user?.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.firstName}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-gray-900 leading-none">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{user?.designation || user?.department}</p>
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
