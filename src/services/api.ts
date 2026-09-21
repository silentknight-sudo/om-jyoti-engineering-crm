import {
  User,
  Lead,
  LeadStatus,
  LeadPriority,
  CallLog,
  LeadNote,
  LeadHistoryItem,
  Product,
  InventoryMovement,
  Supplier,
  LowStockAlert,
  ActivityLog,
  LeadImportRecord,
  DashboardKPIData,
  Role,
  Team,
  Party,
  CustomerEquipment,
  ServiceJob,
  Quotation,
  Invoice,
  PaymentIn
} from '../types';

let authToken: string | null = localStorage.getItem('omjyoti_auth_token') || 'usr-admin-1';

export function setApiAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('omjyoti_auth_token', token);
  } else {
    localStorage.removeItem('omjyoti_auth_token');
  }
}

export function getApiAuthToken(): string | null {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errData.message || `Request failed with status ${response.status}`);
    } else {
      throw new Error(`Request to ${endpoint} failed with status ${response.status}`);
    }
  }

  if (!isJson) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON from ${endpoint} but received ${contentType || 'non-JSON response'}`);
    }
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await request<{ access_token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setApiAuthToken(data.access_token);
    return data;
  },

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    role?: string;
  }): Promise<{ message: string; access_token: string; user: User }> {
    const data = await request<{ message: string; access_token: string; user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    setApiAuthToken(data.access_token);
    return data;
  },

  async logout(): Promise<void> {
    await request('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    setApiAuthToken(null);
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/v1/auth/me');
  },

  // Leads
  async getLeads(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    assigned_telecaller_id?: string;
    assigned_team_lead_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<{ data: Lead[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.assigned_telecaller_id) searchParams.set('assigned_telecaller_id', params.assigned_telecaller_id);
    if (params?.assigned_team_lead_id) searchParams.set('assigned_team_lead_id', params.assigned_team_lead_id);
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order);

    const queryStr = searchParams.toString();
    return request(`/api/v1/leads${queryStr ? '?' + queryStr : ''}`);
  },

  async getLeadById(id: string): Promise<{
    lead: Lead;
    call_history: CallLog[];
    notes: LeadNote[];
    activity_timeline: LeadHistoryItem[];
  }> {
    return request(`/api/v1/leads/${id}`);
  },

  async createLead(leadData: Partial<Lead>): Promise<{ message: string; lead: Lead }> {
    return request('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<{ message: string; lead: Lead }> {
    return request(`/api/v1/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData)
    });
  },

  async updateLeadStatus(id: string, new_status: LeadStatus, reason?: string): Promise<{ message: string; lead: Lead }> {
    return request(`/api/v1/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ new_status, reason })
    });
  },

  async assignLead(id: string, teamLeadId?: string, telecallerId?: string): Promise<{ message: string; lead: Lead }> {
    return request(`/api/v1/leads/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({
        assigned_team_lead_id: teamLeadId,
        assigned_telecaller_id: telecallerId
      })
    });
  },

  async deleteLead(id: string): Promise<{ message: string }> {
    return request(`/api/v1/leads/${id}`, {
      method: 'DELETE'
    });
  },

  async logCall(id: string, callData: {
    duration: number;
    notes: string;
    outcome: string;
    status: string;
    recording_url?: string;
  }): Promise<{ message: string; call_log: CallLog; lead: Lead }> {
    return request(`/api/v1/leads/${id}/call-log`, {
      method: 'POST',
      body: JSON.stringify(callData)
    });
  },

  async addLeadNote(id: string, noteText: string): Promise<{ message: string; note: LeadNote }> {
    return request(`/api/v1/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note_text: noteText })
    });
  },

  async importLeads(data: {
    leads: any[];
    filename: string;
    assignmentMethod?: { team_lead_id?: string };
  }): Promise<{ message: string; import_record: LeadImportRecord }> {
    return request('/api/v1/leads/import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Employees & Teams
  async getEmployees(params?: { role?: string; status?: string; search?: string }): Promise<{ employees: User[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request(`/api/v1/employees${query ? '?' + query : ''}`);
  },

  async getEmployeeById(id: string): Promise<{ employee: User; performance: any }> {
    return request(`/api/v1/employees/${id}`);
  },

  async createEmployee(employeeData: Partial<User>): Promise<{ message: string; employee: User }> {
    return request('/api/v1/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
  },

  async updateEmployee(id: string, employeeData: Partial<User>): Promise<{ message: string; employee: User }> {
    return request(`/api/v1/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData)
    });
  },

  async updateEmployeeStatus(id: string, status: string, reason?: string): Promise<{ message: string; user: User }> {
    return request(`/api/v1/employees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  },

  async resetEmployeePassword(id: string, temporary_password?: string): Promise<{ message: string }> {
    return request(`/api/v1/employees/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ temporary_password })
    });
  },

  async getTeams(): Promise<{ teams: Team[] }> {
    return request('/api/v1/teams');
  },

  async createTeam(teamData: { name: string; description: string; teamLeadId: string }): Promise<{ team: Team }> {
    return request('/api/v1/teams', {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
  },

  // Inventory
  async getProducts(params?: { category?: string; search?: string; low_stock_only?: boolean }): Promise<{ products: Product[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.low_stock_only) searchParams.set('low_stock_only', 'true');
    const query = searchParams.toString();
    return request(`/api/v1/inventory/products${query ? '?' + query : ''}`);
  },

  async getProductById(id: string): Promise<{ product: Product; stock_level: any; movement_history: InventoryMovement[] }> {
    return request(`/api/v1/inventory/products/${id}`);
  },

  async createProduct(productData: Partial<Product> & { initialStock?: number }): Promise<{ message: string; product: Product }> {
    return request('/api/v1/inventory/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async adjustStock(productId: string, data: {
    movement_type: string;
    quantity_change: number;
    warehouse_from?: string;
    warehouse_to?: string;
    notes?: string;
  }): Promise<{ message: string; product: Product; movement: InventoryMovement }> {
    return request(`/api/v1/inventory/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async getLowStockAlerts(): Promise<{ alerts: LowStockAlert[]; count: number }> {
    return request('/api/v1/inventory/low-stock-alerts');
  },

  async getInventoryMovements(): Promise<{ movements: InventoryMovement[]; total: number }> {
    return request('/api/v1/inventory/movements');
  },

  async getSuppliers(): Promise<{ suppliers: Supplier[] }> {
    return request('/api/v1/inventory/suppliers');
  },

  async createSupplier(supplierData: Partial<Supplier>): Promise<{ supplier: Supplier }> {
    return request('/api/v1/inventory/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData)
    });
  },

  // Parties (Customers & Suppliers)
  async getParties(params?: { partyType?: string; status?: string; search?: string }): Promise<{ parties: Party[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.partyType) searchParams.set('partyType', params.partyType);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request(`/api/v1/parties${query ? '?' + query : ''}`);
  },

  async getPartyById(id: string): Promise<{ party: Party; equipment: CustomerEquipment[]; serviceJobs: ServiceJob[]; quotations: Quotation[] }> {
    return request(`/api/v1/parties/${id}`);
  },

  async createParty(data: Partial<Party>): Promise<{ message: string; party: Party }> {
    return request('/api/v1/parties', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateParty(id: string, data: Partial<Party>): Promise<{ message: string; party: Party }> {
    return request(`/api/v1/parties/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteParty(id: string): Promise<{ message: string }> {
    return request(`/api/v1/parties/${id}`, { method: 'DELETE' });
  },

  // Customer Equipment
  async addEquipment(partyId: string, data: Partial<CustomerEquipment>): Promise<{ message: string; equipment: CustomerEquipment }> {
    return request(`/api/v1/parties/${partyId}/equipment`, { method: 'POST', body: JSON.stringify(data) });
  },

  async updateEquipment(id: string, data: Partial<CustomerEquipment>): Promise<{ message: string; equipment: CustomerEquipment }> {
    return request(`/api/v1/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteEquipment(id: string): Promise<{ message: string }> {
    return request(`/api/v1/equipment/${id}`, { method: 'DELETE' });
  },

  // Service Jobs
  async getServiceJobs(params?: { status?: string; partyId?: string; search?: string }): Promise<{ serviceJobs: ServiceJob[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.partyId) searchParams.set('partyId', params.partyId);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request(`/api/v1/service-jobs${query ? '?' + query : ''}`);
  },

  async createServiceJob(data: Partial<ServiceJob>): Promise<{ message: string; serviceJob: ServiceJob }> {
    return request('/api/v1/service-jobs', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateServiceJob(id: string, data: Partial<ServiceJob>): Promise<{ message: string; serviceJob: ServiceJob }> {
    return request(`/api/v1/service-jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteServiceJob(id: string): Promise<{ message: string }> {
    return request(`/api/v1/service-jobs/${id}`, { method: 'DELETE' });
  },

  // Quotations
  async getQuotations(params?: { status?: string; partyId?: string; search?: string }): Promise<{ quotations: Quotation[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.partyId) searchParams.set('partyId', params.partyId);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request(`/api/v1/quotations${query ? '?' + query : ''}`);
  },

  async getQuotationById(id: string): Promise<{ quotation: Quotation }> {
    return request(`/api/v1/quotations/${id}`);
  },

  async createQuotation(data: Partial<Quotation>): Promise<{ message: string; quotation: Quotation }> {
    return request('/api/v1/quotations', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateQuotation(id: string, data: Partial<Quotation>): Promise<{ message: string; quotation: Quotation }> {
    return request(`/api/v1/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async updateQuotationStatus(id: string, status: string): Promise<{ message: string; quotation: Quotation }> {
    return request(`/api/v1/quotations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  async deleteQuotation(id: string): Promise<{ message: string }> {
    return request(`/api/v1/quotations/${id}`, { method: 'DELETE' });
  },

  // Sales Invoices
  async getInvoices(params?: { status?: string; partyId?: string; search?: string }): Promise<{ invoices: Invoice[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.partyId) searchParams.set('partyId', params.partyId);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request(`/api/v1/invoices${query ? '?' + query : ''}`);
  },

  async getInvoiceById(id: string): Promise<{ invoice: Invoice; payments: PaymentIn[] }> {
    return request(`/api/v1/invoices/${id}`);
  },

  async createInvoice(data: Partial<Invoice>): Promise<{ message: string; invoice: Invoice }> {
    return request('/api/v1/invoices', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<{ message: string; invoice: Invoice }> {
    return request(`/api/v1/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async updateInvoiceStatus(id: string, status: string): Promise<{ message: string; invoice: Invoice }> {
    return request(`/api/v1/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  async deleteInvoice(id: string): Promise<{ message: string }> {
    return request(`/api/v1/invoices/${id}`, { method: 'DELETE' });
  },

  // Payment In
  async getPayments(params?: { partyId?: string; invoiceId?: string; search?: string }): Promise<{ payments: PaymentIn[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.partyId) searchParams.set('partyId', params.partyId);
    if (params?.invoiceId) searchParams.set('invoiceId', params.invoiceId);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request(`/api/v1/payments${query ? '?' + query : ''}`);
  },

  async createPayment(data: Partial<PaymentIn>): Promise<{ message: string; payment: PaymentIn; invoice?: Invoice }> {
    return request('/api/v1/payments', { method: 'POST', body: JSON.stringify(data) });
  },

  async deletePayment(id: string): Promise<{ message: string }> {
    return request(`/api/v1/payments/${id}`, { method: 'DELETE' });
  },

  // Dashboard & Analytics
  async getDashboardData(): Promise<DashboardKPIData & { lowStockAlerts: LowStockAlert[] }> {
    return request('/api/v1/dashboard/admin');
  },

  async getLeadsSummaryReport(): Promise<any> {
    return request('/api/v1/reports/leads-summary');
  },

  async getSalesPipelineReport(): Promise<any> {
    return request('/api/v1/reports/sales-pipeline');
  },

  async getInventoryStatusReport(): Promise<any> {
    return request('/api/v1/reports/inventory-status');
  },

  // Settings & Activity Logs
  async getHealth(): Promise<any> {
    return request('/api/v1/health');
  },

  async getSettings(): Promise<{ settings: Record<string, any> }> {
    return request('/api/v1/settings');
  },

  async updateSetting(key: string, value: any): Promise<any> {
    return request(`/api/v1/settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ setting_value: value })
    });
  },

  async getRoles(): Promise<{ roles: Role[] }> {
    return request('/api/v1/roles');
  },

  async getActivityLogs(params?: { limit?: number; search?: string } | number): Promise<{ logs: ActivityLog[]; total: number }> {
    const limit = typeof params === 'number' ? params : (params?.limit || 50);
    const search = typeof params === 'object' && params?.search ? `&search=${encodeURIComponent(params.search)}` : '';
    return request(`/api/v1/activity-logs?limit=${limit}${search}`);
  }
};
