import React from 'react';
  import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  BarChart3,
  Settings,
  Plus,
  Shield,
  Droplets,
  Wrench,
  FileSpreadsheet,
  FileText,
  Receipt,
  Truck,
  ShoppingBag,
  Wallet,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab: currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    { id: 'leads', label: 'Leads Management', icon: Users, badge: 'Live', permission: 'leads' },
    { id: 'customers', label: 'Customers', icon: Users, permission: 'customers' },
    { id: 'quotations', label: 'Quotation Maker', icon: FileText, permission: 'quotations' },
    { id: 'invoices', label: 'Sales Invoices', icon: Receipt, permission: 'invoices' },
    { id: 'challans', label: 'Delivery Challan', icon: Truck, permission: 'challans' },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag, permission: 'purchases' },
    { id: 'expenses', label: 'Expenses', icon: Wallet, permission: 'expenses' },
    { id: 'service', label: 'Service & AMC Jobs', icon: Wrench, permission: 'service' },
    { id: 'employees', label: 'Employees & Teams', icon: Briefcase, permission: 'employees' },
    { id: 'inventory', label: 'Inventory & Spares', icon: Package, permission: 'inventory' },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, permission: 'analytics' },
    { id: 'settings', label: 'System & Audit', icon: Settings, permission: 'settings' }
  ];

  return (
    <>
    {mobileOpen && (
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onCloseMobile}></div>
    )}
    <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 h-screen sticky top-0 z-50 fixed lg:static inset-y-0 left-0 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {onCloseMobile && (
        <button onClick={onCloseMobile} className="lg:hidden absolute top-3 right-3 p-1 text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      )}
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center border-b border-gray-100 space-x-3 bg-gradient-to-r from-blue-900 via-[#00288e] to-blue-950 text-white">
        <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center ring-1 ring-white/20">
          <Droplets className="w-5 h-5 text-blue-200" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm tracking-tight text-white flex items-center space-x-1">
            <span>OM JYOTI CRM</span>
          </h1>
          <p className="text-[10px] text-blue-200 font-medium tracking-wide uppercase truncate">
            Engineering Solutions
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Main Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 text-[#00288e] shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00288e]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-[#00288e] text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-gray-700">API Gateway: Online</span>
          </span>
          <span className="text-gray-400 font-mono text-[10px]">v2.4.0</span>
        </div>
        <div className="text-[10px] text-gray-400 flex items-center space-x-1">
          <Wrench className="w-3 h-3 text-gray-400" />
          <span>Industrial STP & RO Division</span>
        </div>
      </div>
    </aside>
    </>
  );
};
