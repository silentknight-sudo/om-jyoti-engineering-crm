export type UserRole = 'super_admin' | 'admin' | 'team_lead' | 'telecaller' | 'manager' | 'data_entry_operator';

export type UserStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: string[];
  isCustom?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  roleId: string;
  teamId?: string;
  teamName?: string;
  department: string;
  designation: string;
  profilePhotoUrl?: string;
  status: UserStatus;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  teamLeadId: string;
  teamLeadName?: string;
  memberIds: string[];
  members?: User[];
  createdAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'not_interested' | 'follow_up' | 'qualified' | 'converted' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high';
export type LeadSource = 'website' | 'cold_call' | 'referral' | 'event' | 'email' | 'social_media' | 'other';

export interface Lead {
  id: string;
  leadIdNumber: string; // e.g. LEAD-001
  customerName: string;
  email: string;
  phone: string;
  companyName: string;
  productInterests: string[]; // e.g. ['STP', 'RO Plant', 'Effluent Treatment']
  leadSource: LeadSource;
  leadStatus: LeadStatus;
  priority: LeadPriority;
  assignedTeamLeadId?: string;
  assignedTeamLeadName?: string;
  assignedTelecallerId?: string;
  assignedTelecallerName?: string;
  leadValue: number; // in INR
  customerNotes?: string;
  attachments?: { name: string; url: string; size: string }[];
  location: string;
  industryType: string;
  expectedCloseDate?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  winLossReason?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type CallStatus = 'completed' | 'missed' | 'rejected' | 'no_answer';
export type CallOutcome = 'interested' | 'not_interested' | 'follow_up_scheduled' | 'no_decision';

export interface CallLog {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  userRole?: string;
  callDate: string;
  callDurationSeconds: number;
  callStatus: CallStatus;
  notes: string;
  outcome: CallOutcome;
  audioRecordingUrl?: string;
  recordingDuration?: number;
  createdAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  noteText: string;
  attachments?: { name: string; url: string }[];
  createdAt: string;
}

export interface LeadHistoryItem {
  id: string;
  leadId: string;
  changedById: string;
  changedByName: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changeType: 'status_change' | 'assignment' | 'note_added' | 'call_logged' | 'created';
  changedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  specifications: Record<string, string>;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  marginPercentage: number;
  taxRate: number;
  reorderLevel: number;
  imageUrl?: string;
  datasheetUrl?: string;
  supplierId?: string;
  supplierName?: string;
  status: 'active' | 'inactive';
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

export type InventoryItem = Product;


export type MovementType = 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'damage';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: MovementType;
  quantityChange: number;
  warehouseFrom?: string;
  warehouseTo?: string;
  referenceId?: string;
  notes?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentTerms: string;
  leadTimeDays: number;
  status: 'active' | 'inactive';
}

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantityOnHand: number;
  reorderLevel: number;
  severity: 'high' | 'medium';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'lead' | 'user' | 'product' | 'inventory' | 'team' | 'auth' | 'system';
  entityId?: string;
  details?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

export interface LeadImportRecord {
  id: string;
  filename: string;
  fileSize: number;
  importedById: string;
  importedByName: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  importStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorDetails: { row: number; phone?: string; error: string }[];
  importedAt: string;
}

export type PartyType = 'customer' | 'supplier';

export interface Party {
  id: string;
  partyIdNumber: string; // e.g. CUST-001
  partyType: PartyType;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  gstin?: string;
  panNumber?: string;
  billingAddress: string;
  shippingAddress?: string;
  city: string;
  state: string;
  postalCode?: string;
  openingBalance: number;
  balanceType: 'to_collect' | 'to_pay';
  notes?: string;
  status: 'active' | 'inactive';
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentCategory = 'STP' | 'ETP' | 'RO Plant' | 'WTP' | 'Softener' | 'Pump System' | 'Other';

export interface CustomerEquipment {
  id: string;
  partyId: string;
  equipmentName: string;
  category: EquipmentCategory;
  make?: string;
  model?: string;
  capacity?: string;
  serialNumber?: string;
  installationDate?: string;
  warrantyExpiryDate?: string;
  amcActive: boolean;
  amcStartDate?: string;
  amcEndDate?: string;
  serviceFrequencyDays?: number;
  lastServiceDate?: string;
  nextDueDate?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export type ServiceJobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceJobType = 'amc_routine' | 'breakdown' | 'installation' | 'inspection' | 'chemical_dosing';

export interface ServiceJob {
  id: string;
  jobIdNumber: string; // e.g. SVC-001
  partyId: string;
  partyName?: string;
  equipmentId?: string;
  equipmentName?: string;
  jobType: ServiceJobType;
  status: ServiceJobStatus;
  scheduledDate: string;
  completedDate?: string;
  assignedToId?: string;
  assignedToName?: string;
  workDescription: string;
  partsUsed?: { productId: string; productName: string; quantity: number; cost: number }[];
  chargeAmount: number;
  paymentReceived: boolean;
  customerSignature?: string;
  engineerNotes?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuotationLineItem {
  id: string;
  productId?: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  taxPercent: number;
  amount: number; // computed line total incl. tax
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. QTN-2026-0001
  partyId: string;
  partyName: string;
  partyPhone?: string;
  partyAddress?: string;
  partyGstin?: string;
  quotationDate: string;
  validUntil: string;
  status: QuotationStatus;
  items: QuotationLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  termsAndConditions?: string;
  notes?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardKPIData {
  totalLeads: number;
  totalLeadsChange: number; // percentage e.g. 12
  conversionRate: number; // percentage e.g. 32
  conversionRatePrev: number; // percentage e.g. 28
  convertedThisMonth: number;
  convertedTargetMonth: number;
  revenuePipeline: number; // e.g. 4560000
  revenuePipelineChange: number; // e.g. 8
  pipelineFunnel: {
    stage: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  teamPerformance: {
    name: string;
    assigned: number;
    contacted: number;
    converted: number;
    revenue: number;
  }[];
  recentLeads: Lead[];
  recentActivities: ActivityLog[];
}
