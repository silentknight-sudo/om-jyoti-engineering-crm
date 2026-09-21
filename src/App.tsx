import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { LeadsListView } from './components/leads/LeadsListView';
import { LeadDetailsView } from './components/leads/LeadDetailsView';
import { CreateLeadModal } from './components/leads/CreateLeadModal';
import { EditLeadModal } from './components/leads/EditLeadModal';
import { ImportLeadsModal } from './components/leads/ImportLeadsModal';
import { RecordCallModal } from './components/leads/RecordCallModal';
import { InventoryView } from './components/inventory/InventoryView';
import { EmployeesView } from './components/employees/EmployeesView';
import { SettingsAuditView } from './components/settings/SettingsAuditView';
import { CustomersView } from './components/customers/CustomersView';
import { QuotationsView } from './components/quotations/QuotationsView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { DeliveryChallanView } from './components/challans/DeliveryChallanView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ServiceJobsView } from './components/service/ServiceJobsView';
import { Lead } from './types';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal States
  const [createLeadModalOpen, setCreateLeadModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [recordingCallLead, setRecordingCallLead] = useState<Lead | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#00288e] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-gray-600 tracking-wide">
            Initializing Om Jyoti Engineering CRM...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginView />;
  }

  const handleSelectLead = (id: string) => {
    setSelectedLeadId(id);
    setActiveTab('leads');
  };

  const handleBackToLeads = () => {
    setSelectedLeadId(null);
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setSelectedLeadId(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 antialiased selection:bg-blue-100 selection:text-[#00288e]">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
      />

      {/* Main Workspace with Sidebar and Content View */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content Canvas */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/50">
          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectLead={handleSelectLead}
              onOpenCreateLead={() => setCreateLeadModalOpen(true)}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'leads' && !selectedLeadId && (
            <LeadsListView
              key={refreshTrigger}
              onSelectLead={handleSelectLead}
              onOpenCreateModal={() => setCreateLeadModalOpen(true)}
              onOpenImportModal={() => setImportModalOpen(true)}
              onEditLead={lead => setEditingLead(lead)}
              onRecordCall={lead => setRecordingCallLead(lead)}
            />
          )}

          {activeTab === 'leads' && selectedLeadId && (
            <LeadDetailsView
              leadId={selectedLeadId}
              onBack={handleBackToLeads}
              onEditLead={lead => setEditingLead(lead)}
              onRecordCall={lead => setRecordingCallLead(lead)}
            />
          )}

          {activeTab === 'customers' && <CustomersView />}

          {activeTab === 'quotations' && <QuotationsView />}

          {activeTab === 'invoices' && <InvoicesView />}

          {activeTab === 'challans' && <DeliveryChallanView />}

          {activeTab === 'purchases' && <PurchasesView />}

          {activeTab === 'expenses' && <ExpensesView />}

          {activeTab === 'service' && <ServiceJobsView />}

          {activeTab === 'inventory' && <InventoryView />}

          {activeTab === 'employees' && <EmployeesView />}

          {activeTab === 'reports' && (
            <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
              <DashboardView
                onSelectLead={handleSelectLead}
                onOpenCreateLead={() => setCreateLeadModalOpen(true)}
                onNavigate={handleNavigate}
              />
            </div>
          )}

          {activeTab === 'settings' && <SettingsAuditView />}
        </main>
      </div>

      {/* Modals */}
      <CreateLeadModal
        isOpen={createLeadModalOpen}
        onClose={() => setCreateLeadModalOpen(false)}
        onSuccess={() => {
          setRefreshTrigger(p => p + 1);
        }}
      />

      <EditLeadModal
        lead={editingLead}
        isOpen={!!editingLead}
        onClose={() => setEditingLead(null)}
        onSuccess={() => {
          setRefreshTrigger(p => p + 1);
        }}
      />

      <ImportLeadsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setRefreshTrigger(p => p + 1);
        }}
      />

      <RecordCallModal
        lead={recordingCallLead}
        isOpen={!!recordingCallLead}
        onClose={() => setRecordingCallLead(null)}
        onSuccess={() => {
          setRefreshTrigger(p => p + 1);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
