import {
  User,
  Team,
  Lead,
  CallLog,
  LeadNote,
  LeadHistoryItem,
  Product,
  InventoryMovement,
  Supplier,
  LowStockAlert,
  ActivityLog,
  LeadImportRecord,
  Role,
  DashboardKPIData,
  UserRole,
  Party,
  CustomerEquipment,
  ServiceJob,
  Quotation,
  Invoice,
  PaymentIn,
  DeliveryChallan,
  PurchaseBill,
  Expense
} from '../src/types';

// In-Memory Database Store for Om Jyoti Engineering CRM
export class Database {
  roles: Role[] = [
    {
      id: 'role-super-admin',
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Complete unrestricted access to all data, settings, and users',
      permissions: ['all']
    },
    {
      id: 'role-admin',
      name: 'admin',
      displayName: 'Admin',
      description: 'Full administrative access except deleting other admins',
      permissions: ['leads:all', 'employees:all', 'inventory:all', 'reports:all', 'settings:all']
    },
    {
      id: 'role-team-lead',
      name: 'team_lead',
      displayName: 'Team Lead',
      description: 'Manage team leads, assign to telecallers, monitor team performance',
      permissions: ['leads:read_team', 'leads:create', 'leads:update_team', 'leads:assign_team', 'reports:team', 'inventory:read']
    },
    {
      id: 'role-telecaller',
      name: 'telecaller',
      displayName: 'Telecaller',
      description: 'Handle and update assigned leads, record calls, add notes',
      permissions: ['leads:read_assigned', 'leads:update_assigned', 'calls:create', 'notes:create', 'inventory:read']
    },
    {
      id: 'role-manager',
      name: 'manager',
      displayName: 'Operations Manager',
      description: 'Oversee multiple teams, performance analytics, inventory supervision',
      permissions: ['leads:read_all', 'reports:all', 'inventory:read', 'employees:read']
    },
    {
      id: 'role-data-entry',
      name: 'data_entry_operator',
      displayName: 'Data Entry Operator',
      description: 'Import leads, validate data entries, limited reporting',
      permissions: ['leads:import', 'leads:read_basic']
    }
  ];

  users: (User & { passwordHash: string })[] = [
    {
      id: 'usr-admin-1',
      email: 'admin@omjyotiengg.com',
      passwordHash: 'pass@123',
      firstName: 'Admin',
      lastName: 'Director',
      phone: '+91 98110 12345',
      role: 'super_admin',
      roleId: 'role-super-admin',
      department: 'Executive Management',
      designation: 'Managing Director & Super Admin',
      profilePhotoUrl: '',
      status: 'active',
      lastLogin: new Date().toISOString(),
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    }
  ];

  teams: Team[] = [];
  suppliers: Supplier[] = [];
  products: Product[] = [];
  inventoryMovements: InventoryMovement[] = [];
  leads: Lead[] = [];
  callLogs: CallLog[] = [];
  leadNotes: LeadNote[] = [];
  leadHistory: LeadHistoryItem[] = [];
  leadImports: LeadImportRecord[] = [];
  parties: Party[] = [];
  equipment: CustomerEquipment[] = [];
  serviceJobs: ServiceJob[] = [];
  quotations: Quotation[] = [];
  invoices: Invoice[] = [];
  payments: PaymentIn[] = [];
  deliveryChallans: DeliveryChallan[] = [];
  purchaseBills: PurchaseBill[] = [];
  expenses: Expense[] = [];

  activityLogs: ActivityLog[] = [
    {
      id: 'act-init',
      userId: 'usr-admin-1',
      userName: 'Admin Director',
      userRole: 'super_admin',
      action: 'System initialized in production mode',
      entityType: 'system',
      details: 'Om Jyoti Engineering CRM initialized with clean production database',
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString()
    }
  ];

  systemSettings: Record<string, any> = {
    company_name: 'Om Jyoti Engineering Enterprises',
    company_tagline: 'Engineering Excellence in Industrial Water & Wastewater Solutions',
    company_logo: '/public/assets/logo.png',
    company_email: 'contact@omjyotiengg.com',
    company_phone: '+91 120 456 7890',
    company_address: 'Plot No. 44, Sector 63, Noida, Uttar Pradesh - 201301',
    company_gstin: '',
    company_pan: '',
    company_msme_udyam: '',
    currency_symbol: '₹',
    currency_code: 'INR',
    commission_rates: {
      team_lead: 1.5,
      telecaller: 2.5
    },
    low_stock_auto_email: true,
    lead_status_options: [
      'new',
      'contacted',
      'interested',
      'not_interested',
      'follow_up',
      'qualified',
      'converted',
      'lost'
    ]
  };

  // Helper Methods & Business Rules

  logActivity(
    user: User,
    action: string,
    entityType: ActivityLog['entityType'],
    entityId?: string,
    details?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ) {
    const activity: ActivityLog = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      action,
      entityType,
      entityId,
      details,
      oldValues,
      newValues,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      createdAt: new Date().toISOString()
    };
    this.activityLogs.unshift(activity);
    if (this.activityLogs.length > 200) {
      this.activityLogs.pop();
    }
    return activity;
  }

  getDashboardKPIs(): DashboardKPIData {
    const totalLeads = this.leads.length;
    const convertedLeads = this.leads.filter(l => l.leadStatus === 'converted').length;
    const contactedLeads = this.leads.filter(l => ['contacted', 'interested', 'follow_up', 'qualified', 'converted'].includes(l.leadStatus)).length;
    const qualifiedLeads = this.leads.filter(l => ['qualified', 'converted'].includes(l.leadStatus)).length;

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const revenuePipeline = this.leads
      .filter(l => l.leadStatus !== 'lost')
      .reduce((sum, l) => sum + (l.leadValue || 0), 0);

    const teamPerformance = this.users
      .filter(u => ['telecaller', 'team_lead', 'super_admin', 'admin'].includes(u.role))
      .map(u => {
        const userLeads = this.leads.filter(l => l.assignedTelecallerId === u.id || l.assignedTeamLeadId === u.id);
        const contacted = userLeads.filter(l => l.leadStatus !== 'new').length;
        const converted = userLeads.filter(l => l.leadStatus === 'converted').length;
        const revenue = userLeads.filter(l => l.leadStatus === 'converted').reduce((sum, l) => sum + (l.leadValue || 0), 0);
        return {
          name: `${u.firstName} ${u.lastName?.[0] ? u.lastName[0] + '.' : ''}`.trim(),
          assigned: userLeads.length,
          contacted,
          converted,
          revenue
        };
      });

    return {
      totalLeads,
      totalLeadsChange: 0,
      conversionRate,
      conversionRatePrev: 0,
      convertedThisMonth: convertedLeads,
      convertedTargetMonth: 50,
      revenuePipeline,
      revenuePipelineChange: 0,
      pipelineFunnel: [
        { stage: 'Raw Leads', count: totalLeads, percentage: totalLeads > 0 ? 100 : 0, color: 'bg-[#00288e]' },
        { stage: 'Contacted', count: contactedLeads, percentage: totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0, color: 'bg-blue-700' },
        { stage: 'Qualified', count: qualifiedLeads, percentage: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0, color: 'bg-blue-600' },
        { stage: 'Closed Won', count: convertedLeads, percentage: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0, color: 'bg-emerald-600' }
      ],
      teamPerformance,
      recentLeads: this.leads.slice(0, 5),
      recentActivities: this.activityLogs.slice(0, 8)
    };
  }

  nextSequence(prefix: string, currentCount: number): string {
    return `${prefix}-${String(currentCount + 1).padStart(4, '0')}`;
  }

  getLowStockAlerts(): LowStockAlert[] {
    const alerts: LowStockAlert[] = [];
    for (const prod of this.products) {
      if (prod.status === 'active' && prod.quantityOnHand <= prod.reorderLevel) {
        alerts.push({
          id: 'alert-' + prod.id,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantityOnHand: prod.quantityOnHand,
          reorderLevel: prod.reorderLevel,
          severity: prod.quantityOnHand <= 1 ? 'high' : 'medium',
          createdAt: new Date().toISOString()
        });
      }
    }
    return alerts;
  }
}

export const db = new Database();
