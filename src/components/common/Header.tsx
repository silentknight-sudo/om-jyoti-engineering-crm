import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  LogOut,
  PhoneCall,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LowStockAlert, Lead } from '../../types';
import { Avatar } from './Avatar';

interface HeaderProps {
  activeTab?: string;
  onSearchSubmit?: (val: string) => void;
  onOpenCreateLead?: () => void;
  onNavigate?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSearchSubmit,
  onOpenCreateLead,
  onNavigate,
  onToggleMobileMenu
}) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifications) return;
    api.getLowStockAlerts().then(res => setLowStockAlerts(res.alerts)).catch(() => {});
    api.getLeads({ limit: 3, sort_by: 'createdAt', sort_order: 'desc' }).then(res => setRecentLeads(res.data)).catch(() => {});
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    onNavigate && onNavigate('leads');
    onSearchSubmit && onSearchSubmit(searchTerm.trim());
  };

  const notificationCount = lowStockAlerts.length;

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
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-header-search"
            type="text"
            placeholder="Search leads by name, phone or company, then press Enter..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-[#00288e] rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#00288e]/20"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-toggle-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative transition-colors"
            title="System notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Alerts</h4>
                {notificationCount > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{notificationCount} Low Stock</span>
                )}
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {lowStockAlerts.length === 0 && recentLeads.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">No alerts right now.</p>
                )}
                {lowStockAlerts.map(alert => (
                  <div key={alert.id} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setShowNotifications(false); onNavigate && onNavigate('inventory'); }}>
                    <div className="flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">Low Stock: {alert.productName}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">On hand ({alert.quantityOnHand}) at or below reorder level ({alert.reorderLevel}).</p>
                      </div>
                    </div>
                  </div>
                ))}
                {recentLeads.map(lead => (
                  <div key={lead.id} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setShowNotifications(false); onNavigate && onNavigate('leads'); }}>
                    <div className="flex items-start space-x-2.5">
                      <PhoneCall className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">Lead: {lead.customerName}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{lead.companyName || lead.location} &bull; {lead.leadStatus.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
          <Avatar firstName={user?.firstName} lastName={user?.lastName} photoUrl={user?.profilePhotoUrl} size={32} />
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
