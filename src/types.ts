export type UserRole = 'super_admin' | 'admin' | 'team_lead' | 'telecaller' | 'manager' | 'data_entry_operator'
  | 'sales_executive' | 'service_sales_executive' | 'order_approver' | 'technician' | 'execution_sales' | 'execution_service';

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

export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  productId?: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  partyId: string;
  partyName: string;
  partyPhone?: string;
  partyAddress?: string;
  partyGstin?: string;
  quotationId?: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  termsAndConditions?: string;
  notes?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other';

export interface PaymentIn {
  id: string;
  paymentNumber: string; // e.g. PAY-2026-0001
  partyId: string;
  partyName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
}

export interface DeliveryChallanItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
}

export type DeliveryChallanStatus = 'pending' | 'delivered' | 'converted' | 'cancelled';

export interface DeliveryChallan {
  id: string;
  challanNumber: string; // e.g. DC-2026-0001
  partyId: string;
  partyName: string;
  partyAddress?: string;
  invoiceId?: string;
  challanDate: string;
  status: DeliveryChallanStatus;
  items: DeliveryChallanItem[];
  vehicleNumber?: string;
  transportMode?: string;
  notes?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseBillStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface PurchaseBillItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxPercent: number;
  amount: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string; // e.g. PB-2026-0001
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  billDate: string;
  dueDate: string;
  status: PurchaseBillStatus;
  items: PurchaseBillItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'fuel' | 'travel' | 'office_supplies' | 'salaries' | 'rent' | 'utilities' | 'equipment_repair' | 'chemicals' | 'transport' | 'other';
export type ExpensePaymentMode = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other';

export interface Expense {
  id: string;
  expenseNumber: string; // e.g. EXP-2026-0001
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMode: ExpensePaymentMode;
  vendorName?: string;
  referenceNumber?: string;
  attachmentUrl?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
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

// ==========================================
// PIPELINE MODULE — SRS v1.0 (New Sales & Service Sales workflow)
// ==========================================

export type Division = 'Fire' | 'WTP' | 'STP' | 'ETP' | 'Underwater' | 'Pumps';

export const DIVISIONS: Division[] = ['Fire', 'WTP', 'STP', 'ETP', 'Underwater', 'Pumps'];

export type PipelineLeadType = 'new_sales' | 'service';

export type NewSalesStage =
  | 'new_lead' | 'requirement_sheet' | 'site_visit' | 'quotation' | 'quotation_submitted'
  | 'negotiation' | 'order_punched' | 'order_on_hold' | 'order_approved' | 'execution' | 'order_closed';

export type ServiceStage =
  | 'service_lead' | 'requirement_sheet' | 'technician_assigned' | 'component_assessment'
  | 'fault_assessment' | 'quotation' | 'negotiation' | 'service_order_punched'
  | 'order_on_hold' | 'order_approved' | 'order_rejected' | 'repair_execution' | 'dispatch' | 'closed';

export type PipelineStage = NewSalesStage | ServiceStage;

export const NEW_SALES_STAGES: { id: NewSalesStage; label: string }[] = [
  { id: 'new_lead', label: 'New Lead' },
  { id: 'requirement_sheet', label: 'Requirement Sheet' },
  { id: 'site_visit', label: 'Site Visit / Technical Meeting' },
  { id: 'quotation', label: 'Quotation' },
  { id: 'quotation_submitted', label: 'Quotation Submitted' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'order_punched', label: 'Order Punched' },
  { id: 'order_on_hold', label: 'Order On Hold' },
  { id: 'order_approved', label: 'Order Approved' },
  { id: 'execution', label: 'Execution' },
  { id: 'order_closed', label: 'Order Closed' }
];

export const SERVICE_STAGES: { id: ServiceStage; label: string }[] = [
  { id: 'service_lead', label: 'Service Lead' },
  { id: 'requirement_sheet', label: 'Requirement Sheet' },
  { id: 'technician_assigned', label: 'Technician Assigned' },
  { id: 'component_assessment', label: 'Component Assessment' },
  { id: 'fault_assessment', label: 'Fault Assessment' },
  { id: 'quotation', label: 'Quotation' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'service_order_punched', label: 'Service Order Punched' },
  { id: 'order_on_hold', label: 'On Hold' },
  { id: 'order_approved', label: 'Approved' },
  { id: 'order_rejected', label: 'Rejected' },
  { id: 'repair_execution', label: 'Repair Execution' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'closed', label: 'Closed / Installation' }
];

export type AmcStatus = 'active' | 'expired' | 'none';
export type AmcType = 'comprehensive' | 'spares_only' | 'labour_only' | 'none';

export interface PipelineLead {
  id: string;
  leadNumber: string; // e.g. LD-2026-0001
  leadType: PipelineLeadType;
  division: Division;
  customerName: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  source: LeadSource;
  ownerId: string;
  ownerName: string;
  stage: PipelineStage;
  stageEnteredAt: string; // drives ageing
  lastRemark?: string;
  nextAction?: string;
  nextActionDate?: string;
  lastNegotiatedPrice?: number;

  // Service-only fields (FR-S1)
  amcStatus?: AmcStatus;
  warrantyStatus?: AmcStatus;
  amcStartDate?: string;
  amcEndDate?: string;
  amcType?: AmcType;
  outOfAmcOrWarranty?: boolean; // if true, everything is payable
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assessmentLocation?: 'factory' | 'site';

  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StageHistoryEntry {
  id: string;
  leadId: string;
  fromStage?: PipelineStage;
  toStage: PipelineStage;
  changedById: string;
  changedByName: string;
  changedAt: string;
  note?: string;
}

export interface RequirementSheet {
  id: string;
  leadId: string;
  version: number;
  fields: Record<string, string>; // division-dependent; "NA" where not applicable
  updatedById: string;
  updatedByName?: string;
  updatedAt: string;
  createdAt: string;
}

export type CallType = 'Intro Call' | 'Follow-up Call' | 'Negotiation Call' | 'Technical Discussion Call' | 'Call Not Answered' | 'WhatsApp';
export type MeetingType = 'Follow-up Meeting' | 'Negotiation Meeting' | 'Technical Meeting' | 'Site Visit' | 'Technical Assessment';

export interface ActivityPhoto {
  url: string;
  latitude?: number;
  longitude?: number;
  takenAt: string;
}

export interface FollowUpActivity {
  id: string;
  leadId: string;
  activityKind: 'call' | 'meeting';
  type: CallType | MeetingType;
  stageAtLogging: PipelineStage;
  remark: string;
  nextAction?: string;
  nextActionDate?: string;
  photos?: ActivityPhoto[]; // mandatory for meeting types per FR-F6/FR-F7
  createdById: string;
  createdByName?: string;
  createdAt: string;
}

// Meeting types that require mandatory photo+GPS verification before being logged as done (FR-F6)
export const PHOTO_REQUIRED_MEETING_TYPES: MeetingType[] = ['Follow-up Meeting', 'Negotiation Meeting', 'Technical Meeting', 'Site Visit', 'Technical Assessment'];

export interface NegotiationEntry {
  id: string;
  leadId: string;
  entryDate: string;
  discussion: string;
  priceOffered: number;
  requirementChanged: boolean;
  revisedQuotationId?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
}

export interface PipelineQuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxPercent: number;
  amount: number;
}

export type PipelineQuotationStatus = 'draft' | 'submitted' | 'revised' | 'accepted';

export interface PipelineQuotation {
  id: string;
  leadId: string;
  quotationNumber: string; // QTN-2026-0001-Rev0
  revisionNumber: number;
  parentQuotationId?: string;
  status: PipelineQuotationStatus;
  items: PipelineQuotationItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  includesRepairTnC: boolean; // service quotations only (FR-Q2)
  emailScreenshotUrl?: string; // required at "Quotation Submitted" stage (FR-Q3)
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'punched' | 'on_hold' | 'approved' | 'rejected';

export interface OrderDocument {
  id: string;
  type: 'advance_payment_proof' | 'po_or_contract' | 'kyc_pan' | 'kyc_aadhaar' | 'kyc_gst' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface PipelineOrder {
  id: string;
  orderNumber?: string; // issued only on approval (FR-O5)
  leadId: string;
  leadType: PipelineLeadType;
  quotationId: string;
  etd: string; // estimated date of delivery — mandatory at punch (FR-O2)
  documents: OrderDocument[];
  status: OrderStatus;
  holdReason?: string;
  rejectReason?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  punchCount: number; // increments each re-punch after On Hold (FR-O4)
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Sales (project) execution: FR-E1..FR-E12 ----

export type ManufacturingStep = 'fabrication' | 'assembly_piping' | 'testing' | 'final_packaging';
export const MANUFACTURING_STEPS: { id: ManufacturingStep; label: string }[] = [
  { id: 'fabrication', label: 'Fabrication' },
  { id: 'assembly_piping', label: 'Assembly + Piping' },
  { id: 'testing', label: 'Testing' },
  { id: 'final_packaging', label: 'Final Packaging' }
];

export interface ExecutionListItem {
  id: string;
  orderId: string;
  listType: 'purchase' | 'manufacturing';
  itemName: string;
  tentativeDate?: string; // undefined when notApplicable
  dispatchDate?: string;
  notApplicable: boolean;
  stageId?: string; // assigned once clubbed by dispatch date
  completed: boolean;
}

export interface SalesExecutionStage {
  id: string;
  orderId: string;
  stageIndex: number; // Stage 1, 2, 3...
  dispatchDate: string;
  purchaseListComplete: boolean;
  manufacturingListComplete: boolean;
  manufacturingStep?: ManufacturingStep;
  fabricationImageUrls?: string[];
  dispatchDocUrl?: string; // invoice/DC required to mark dispatch complete (FR-E9)
  materialDelivered: boolean;
  onsiteTeamAssigned: boolean;
  onsiteTeamName?: string;
  onsiteComplete: boolean;
  completionPhotoUrls?: string[];
  status: 'pending' | 'in_progress' | 'dispatched' | 'delivered' | 'completed';
  welcomeCallLogged: boolean;
  siteReadinessChecked: boolean;
  siteReadinessEmailSentAt?: string;
  siteImageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// ---- Service (repair) execution: FR-X1..FR-X5 ----

export type ServiceTrackType = 'spares' | 'machining' | 'labour';

export interface ServiceExecutionTrack {
  id: string;
  orderId: string;
  trackType: ServiceTrackType;
  listGenerated: boolean;
  items: string[]; // spares list / machining items (rotor, shaft, chamber) / labour list
  purchaseComplete?: boolean; // spares track
  jobComplete?: boolean; // machining track
  paintingComplete?: boolean; // labour track
}

export interface ServiceExecution {
  id: string;
  orderId: string;
  dismantlingComplete: boolean;
  assemblyInstallationComplete: boolean;
  dispatchDate?: string;
  dispatchDocUrl?: string;
  onsiteInstallationRequired: boolean;
  onsiteInstallationComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Service assessment (component + fault): FR-S4, FR-S5 ----

export type ServiceEquipmentCategory = 'Pumps' | 'Motors' | 'Compressors' | 'High-Pressure Equipment';

export interface ServiceComponentAssessment {
  id: string;
  leadId: string;
  equipmentCategory: ServiceEquipmentCategory;
  photoUrls: string[]; // 3-4 mandatory (FR-S4)
  conditionNotes: string;
  assessedById: string;
  assessedByName?: string;
  assessedAt: string;
}

export interface ServiceFaultAssessment {
  id: string;
  leadId: string;
  faultListPhotoUrl: string; // technician uploads photo of handwritten fault list (FR-S5)
  uploadedById: string;
  uploadedByName?: string;
  uploadedAt: string;
}
