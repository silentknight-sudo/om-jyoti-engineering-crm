import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { User, Lead, LeadStatus, MovementType, Party, CustomerEquipment, ServiceJob, Quotation } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Standard error helper
function sendError(res: Response, status: number, code: string, message: string, details?: any) {
  return res.status(status).json({
    error: true,
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

// Token simulation & user extraction
function extractUserFromHeader(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default to super admin for seamless development or if not signed in
    return db.users[0];
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const foundUser = db.users.find(u => u.id === token || u.email === token);
  return foundUser || db.users[0];
}

// Phone validator with Indian format support
function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^(\+91|\+61|\+1)?[-\s]?[6789]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, '')) || phone.length >= 10;
}

// Email validator
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Status transitions state machine
const validTransitions: Record<string, string[]> = {
  new: ['contacted', 'lost'],
  contacted: ['interested', 'not_interested', 'follow_up', 'lost'],
  interested: ['qualified', 'follow_up', 'lost'],
  follow_up: ['contacted', 'interested', 'qualified', 'lost'],
  qualified: ['converted', 'lost'],
  converted: [], // Final state
  not_interested: [], // Final state
  lost: [] // Final state
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Email and password are required');
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Invalid email address or password');
  }

  if (user.status === 'inactive' || user.status === 'terminated') {
    return sendError(res, 403, 'FORBIDDEN', 'Your account has been deactivated. Please contact administrator.');
  }

  user.lastLogin = new Date().toISOString();
  db.logActivity(user, 'logged in successfully', 'auth', user.id, `Signed in from web console`);

  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;

  return res.json({
    access_token: user.id, // Using user.id as bearer token
    refresh_token: 'refresh_' + user.id + '_' + Date.now(),
    expires_in: 86400,
    user: safeUser
  });
});

app.post('/api/v1/auth/register', (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, role = 'super_admin', department = 'Executive Management', designation = 'Managing Director' } = req.body;
  if (!email || !password || !firstName) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'First name, email and password are required');
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return sendError(res, 400, 'DUPLICATE_ERROR', 'An account with this email already exists');
  }

  const newUser: any = {
    id: 'usr-' + Date.now(),
    email: email.trim().toLowerCase(),
    passwordHash: password,
    firstName: firstName.trim(),
    lastName: lastName ? lastName.trim() : '',
    phone: phone ? phone.trim() : '+91 98000 00000',
    role: role || 'super_admin',
    roleId: 'role-' + (role || 'super_admin'),
    department,
    designation,
    profilePhotoUrl: '',
    status: 'active',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.logActivity(newUser, `registered account`, 'auth', newUser.id);

  const safeUser = { ...newUser };
  delete safeUser.passwordHash;

  return res.status(201).json({
    message: 'Account created successfully',
    access_token: newUser.id,
    user: safeUser
  });
});

app.post('/api/v1/auth/logout', (req: Request, res: Response) => {
  const user = extractUserFromHeader(req);
  if (user) {
    db.logActivity(user, 'logged out', 'auth', user.id);
  }
  return res.json({ message: 'Logged out successfully' });
});

app.post('/api/v1/auth/refresh', (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Refresh token is required');
  }
  return res.json({ access_token: db.users[0].id, expires_in: 86400 });
});

app.get('/api/v1/auth/me', (req: Request, res: Response) => {
  const user = extractUserFromHeader(req);
  if (!user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Session expired');
  }
  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;
  return res.json({ user: safeUser });
});

app.post('/api/v1/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return sendError(res, 404, 'NOT_FOUND', 'No account found with this email address');
  }
  return res.json({ message: 'Password reset link sent to ' + email });
});

app.post('/api/v1/auth/reset-password', (req: Request, res: Response) => {
  const { token, new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Password must be at least 6 characters');
  }
  return res.json({ message: 'Password has been reset successfully' });
});

app.post('/api/v1/auth/two-factor/setup', (req: Request, res: Response) => {
  return res.json({
    secret: 'OJCRMKJ38GZ71QWERTY',
    qr_code: 'otpauth://totp/OmJyotiCRM:admin@omjyotiengg.com?secret=OJCRMKJ38GZ71QWERTY&issuer=OmJyotiCRM'
  });
});

app.post('/api/v1/auth/two-factor/verify', (req: Request, res: Response) => {
  return res.json({
    message: '2FA verified and enabled',
    backup_codes: ['8472-1928', '3829-1029', '4910-4820', '5819-2048']
  });
});

// ==========================================
// 2. LEADS ENDPOINTS
// ==========================================

app.get('/api/v1/leads', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req);
  const { page = '1', limit = '10', status, priority, search, assigned_telecaller_id, assigned_team_lead_id, sort_by = 'createdAt', sort_order = 'desc' } = req.query;

  let results = [...db.leads];

  // Role based filtering
  if (currentUser && currentUser.role === 'telecaller') {
    results = results.filter(l => l.assignedTelecallerId === currentUser.id);
  } else if (currentUser && currentUser.role === 'team_lead' && currentUser.teamId) {
    const team = db.teams.find(t => t.id === currentUser.teamId);
    const memberIds = team ? [team.teamLeadId, ...team.memberIds] : [currentUser.id];
    results = results.filter(l => l.assignedTeamLeadId === currentUser.id || (l.assignedTelecallerId && memberIds.includes(l.assignedTelecallerId)));
  }

  // Filter query parameters
  if (status && status !== 'all') {
    results = results.filter(l => l.leadStatus === status);
  }
  if (priority && priority !== 'all') {
    results = results.filter(l => l.priority === priority);
  }
  if (assigned_telecaller_id) {
    results = results.filter(l => l.assignedTelecallerId === assigned_telecaller_id);
  }
  if (assigned_team_lead_id) {
    results = results.filter(l => l.assignedTeamLeadId === assigned_team_lead_id);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(l =>
      l.customerName.toLowerCase().includes(q) ||
      l.companyName.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q)
    );
  }

  // Sorting
  results.sort((a: any, b: any) => {
    const valA = a[sort_by as string] || '';
    const valB = b[sort_by as string] || '';
    if (sort_order === 'asc') {
      return valA > valB ? 1 : -1;
    }
    return valA < valB ? 1 : -1;
  });

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const total = results.length;
  const totalPages = Math.ceil(total / limitNum);
  const paginatedData = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    data: paginatedData,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    },
    filters_applied: { status, priority, search }
  });
});

app.get('/api/v1/leads/:id', (req: Request, res: Response) => {
  const lead = db.leads.find(l => l.id === req.params.id);
  if (!lead) {
    return sendError(res, 404, 'NOT_FOUND', 'Lead not found');
  }

  const callHistory = db.callLogs.filter(c => c.leadId === lead.id);
  const notes = db.leadNotes.filter(n => n.leadId === lead.id);
  const history = db.leadHistory.filter(h => h.leadId === lead.id);

  return res.json({
    lead,
    call_history: callHistory,
    notes,
    activity_timeline: history
  });
});

app.post('/api/v1/leads', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { customerName, phone, email, companyName, productInterests, leadSource = 'website', priority = 'medium', leadValue = 0, customerNotes, location = 'Noida, UP', industryType = 'Manufacturing', assignedTeamLeadId, assignedTelecallerId } = req.body;

  if (!customerName || customerName.trim().length < 2) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Customer name is required (min 2 chars)');
  }
  if (!phone) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Phone number is required');
  }

  // Duplicate phone check
  const existing = db.leads.find(l => l.phone.replace(/[\s-]/g, '') === phone.replace(/[\s-]/g, ''));
  if (existing) {
    return sendError(res, 400, 'DUPLICATE_ERROR', `A lead with phone number ${phone} already exists (${existing.customerName} - ${existing.companyName})`);
  }

  const newLeadNumber = 'LEAD-' + String(db.leads.length + 1).padStart(3, '0');
  const teamLead = db.users.find(u => u.id === assignedTeamLeadId);
  const telecaller = db.users.find(u => u.id === assignedTelecallerId);

  const newLead: Lead = {
    id: 'lead-' + Date.now(),
    leadIdNumber: newLeadNumber,
    customerName: customerName.trim(),
    email: email || '',
    phone: phone.trim(),
    companyName: companyName || '',
    productInterests: Array.isArray(productInterests) ? productInterests : ['Water Treatment'],
    leadSource,
    leadStatus: 'new',
    priority,
    assignedTeamLeadId: assignedTeamLeadId || undefined,
    assignedTeamLeadName: teamLead ? `${teamLead.firstName} ${teamLead.lastName}` : undefined,
    assignedTelecallerId: assignedTelecallerId || undefined,
    assignedTelecallerName: telecaller ? `${telecaller.firstName} ${telecaller.lastName}` : undefined,
    leadValue: Number(leadValue) || 0,
    customerNotes: customerNotes || '',
    location,
    industryType,
    createdById: currentUser.id,
    createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.leads.unshift(newLead);

  // History trail
  db.leadHistory.unshift({
    id: 'hist-' + Date.now(),
    leadId: newLead.id,
    changedById: currentUser.id,
    changedByName: `${currentUser.firstName} ${currentUser.lastName}`,
    fieldName: 'lead',
    oldValue: '',
    newValue: `Lead created by ${currentUser.firstName} ${currentUser.lastName}`,
    changeType: 'created',
    changedAt: new Date().toISOString()
  });

  db.logActivity(currentUser, `created new lead for ${newLead.customerName} (${newLead.companyName})`, 'lead', newLead.id, `Lead ID: ${newLead.leadIdNumber}`);

  return res.status(201).json({
    message: 'Lead created successfully',
    lead: newLead
  });
});

app.put('/api/v1/leads/:id', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const leadIndex = db.leads.findIndex(l => l.id === req.params.id);
  if (leadIndex === -1) {
    return sendError(res, 404, 'NOT_FOUND', 'Lead not found');
  }

  const oldLead = db.leads[leadIndex];
  const updatedData = { ...oldLead, ...req.body, updatedAt: new Date().toISOString() };

  // Resolve names
  if (req.body.assignedTeamLeadId) {
    const tl = db.users.find(u => u.id === req.body.assignedTeamLeadId);
    updatedData.assignedTeamLeadName = tl ? `${tl.firstName} ${tl.lastName}` : oldLead.assignedTeamLeadName;
  }
  if (req.body.assignedTelecallerId) {
    const tc = db.users.find(u => u.id === req.body.assignedTelecallerId);
    updatedData.assignedTelecallerName = tc ? `${tc.firstName} ${tc.lastName}` : oldLead.assignedTelecallerName;
  }

  db.leads[leadIndex] = updatedData;
  db.logActivity(currentUser, `updated lead details for ${updatedData.customerName}`, 'lead', updatedData.id);

  return res.json({ message: 'Lead updated', lead: updatedData });
});

app.patch('/api/v1/leads/:id/status', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { new_status, reason } = req.body;

  const lead = db.leads.find(l => l.id === req.params.id);
  if (!lead) {
    return sendError(res, 404, 'NOT_FOUND', 'Lead not found');
  }

  const oldStatus = lead.leadStatus;
  const allowed = validTransitions[oldStatus];

  // Super Admin can override, otherwise check allowed transitions
  if (currentUser.role !== 'super_admin' && (!allowed || !allowed.includes(new_status))) {
    return sendError(res, 400, 'INVALID_TRANSITION', `Invalid status transition: cannot change from "${oldStatus}" to "${new_status}". Allowed: ${allowed?.join(', ') || 'none'}`);
  }

  lead.leadStatus = new_status as LeadStatus;
  lead.updatedAt = new Date().toISOString();
  if (reason) {
    lead.winLossReason = reason;
  }

  // Record in audit timeline
  db.leadHistory.unshift({
    id: 'hist-' + Date.now(),
    leadId: lead.id,
    changedById: currentUser.id,
    changedByName: `${currentUser.firstName} ${currentUser.lastName}`,
    fieldName: 'status',
    oldValue: oldStatus,
    newValue: new_status,
    changeType: 'status_change',
    changedAt: new Date().toISOString()
  });

  db.logActivity(currentUser, `moved ${lead.companyName || lead.customerName} to ${new_status}`, 'lead', lead.id, reason ? `Reason: ${reason}` : undefined);

  return res.json({
    message: `Lead status updated to ${new_status}`,
    lead,
    status_changed_at: new Date().toISOString()
  });
});

app.patch('/api/v1/leads/:id/assign', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { assigned_team_lead_id, assigned_telecaller_id } = req.body;

  const lead = db.leads.find(l => l.id === req.params.id);
  if (!lead) {
    return sendError(res, 404, 'NOT_FOUND', 'Lead not found');
  }

  if (assigned_team_lead_id !== undefined) {
    const tl = db.users.find(u => u.id === assigned_team_lead_id);
    lead.assignedTeamLeadId = assigned_team_lead_id;
    lead.assignedTeamLeadName = tl ? `${tl.firstName} ${tl.lastName}` : undefined;
  }

  if (assigned_telecaller_id !== undefined) {
    const tc = db.users.find(u => u.id === assigned_telecaller_id);
    lead.assignedTelecallerId = assigned_telecaller_id;
    lead.assignedTelecallerName = tc ? `${tc.firstName} ${tc.lastName}` : undefined;
  }

  lead.updatedAt = new Date().toISOString();

  db.leadHistory.unshift({
    id: 'hist-' + Date.now(),
    leadId: lead.id,
    changedById: currentUser.id,
    changedByName: `${currentUser.firstName} ${currentUser.lastName}`,
    fieldName: 'assignment',
    oldValue: '',
    newValue: `Assigned to ${lead.assignedTelecallerName || lead.assignedTeamLeadName || 'Unassigned'}`,
    changeType: 'assignment',
    changedAt: new Date().toISOString()
  });

  db.logActivity(currentUser, `assigned lead ${lead.leadIdNumber} (${lead.customerName})`, 'lead', lead.id, `Assignee: ${lead.assignedTelecallerName || lead.assignedTeamLeadName}`);

  return res.json({
    message: 'Lead assigned successfully',
    lead,
    assigned_at: new Date().toISOString()
  });
});

app.delete('/api/v1/leads/:id', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const index = db.leads.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return sendError(res, 404, 'NOT_FOUND', 'Lead not found');
  }

  const deletedLead = db.leads[index];
  db.leads.splice(index, 1);
  db.logActivity(currentUser, `deleted lead ${deletedLead.customerName} (${deletedLead.leadIdNumber})`, 'lead', deletedLead.id);

  return res.json({ message: 'Lead deleted successfully' });
});

app.post('/api/v1/leads/:id/call-log', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { call_date, duration = 180, notes, outcome = 'interested', status = 'completed', recording_url } = req.body;

  const lead = db.leads.find(l => l.id === req.params.id);
  if (!lead) {
    return sendError(res, 404, 'NOT_FOUND', 'Lead not found');
  }

  const callLog: any = {
    id: 'call-' + Date.now(),
    leadId: lead.id,
    userId: currentUser.id,
    userName: `${currentUser.firstName} ${currentUser.lastName}`,
    userRole: currentUser.role,
    callDate: call_date || new Date().toISOString(),
    callDurationSeconds: Number(duration) || 120,
    callStatus: status,
    notes: notes || 'Call logged with customer',
    outcome,
    audioRecordingUrl: recording_url,
    createdAt: new Date().toISOString()
  };

  db.callLogs.unshift(callLog);
  lead.lastContactDate = callLog.callDate;
  lead.updatedAt = new Date().toISOString();

  // If lead was 'new', advance to 'contacted'
  if (lead.leadStatus === 'new') {
    lead.leadStatus = 'contacted';
  }

  // History
  db.leadHistory.unshift({
    id: 'hist-' + Date.now(),
    leadId: lead.id,
    changedById: currentUser.id,
    changedByName: `${currentUser.firstName} ${currentUser.lastName}`,
    fieldName: 'call_logged',
    oldValue: '',
    newValue: `Call with ${lead.customerName} (${callLog.callDurationSeconds}s) - ${callLog.notes}`,
    changeType: 'call_logged',
    changedAt: new Date().toISOString()
  });

  db.logActivity(currentUser, `logged a call with ${lead.customerName}`, 'lead', lead.id, `${callLog.callDurationSeconds}s - Outcome: ${outcome}`);

  return res.status(201).json({
    message: 'Call log recorded',
    call_log_id: callLog.id,
    call_log: callLog,
    lead
  });
});

app.post('/api/v1/leads/:id/notes', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { note_text, attachments } = req.body;

  const lead = db.leads.find(l => l.id === req.params.id);
  if (!lead) {
    return sendError(res, 404, 'NOT_FOUND', 'Lead not found');
  }

  const note = {
    id: 'note-' + Date.now(),
    leadId: lead.id,
    userId: currentUser.id,
    userName: `${currentUser.firstName} ${currentUser.lastName}`,
    noteText: note_text,
    attachments: attachments || [],
    createdAt: new Date().toISOString()
  };

  db.leadNotes.unshift(note);
  lead.updatedAt = new Date().toISOString();

  db.leadHistory.unshift({
    id: 'hist-' + Date.now(),
    leadId: lead.id,
    changedById: currentUser.id,
    changedByName: `${currentUser.firstName} ${currentUser.lastName}`,
    fieldName: 'note_added',
    oldValue: '',
    newValue: note_text,
    changeType: 'note_added',
    changedAt: new Date().toISOString()
  });

  return res.status(201).json({
    message: 'Note added successfully',
    note
  });
});

app.post('/api/v1/leads/import', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { leads: importedLeads, filename = 'imported_leads.csv', assignmentMethod = {} } = req.body;

  if (!Array.isArray(importedLeads) || importedLeads.length === 0) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'No lead rows provided in import data');
  }

  const importRecord: any = {
    id: 'imp-' + Date.now(),
    filename,
    fileSize: importedLeads.length * 128,
    importedById: currentUser.id,
    importedByName: `${currentUser.firstName} ${currentUser.lastName}`,
    totalRows: importedLeads.length,
    successCount: 0,
    errorCount: 0,
    importStatus: 'completed',
    errorDetails: [],
    importedAt: new Date().toISOString()
  };

  let assignedTeamLeadId = assignmentMethod.team_lead_id;
  let assignedTeamLeadName: string | undefined;
  if (assignedTeamLeadId) {
    const tl = db.users.find(u => u.id === assignedTeamLeadId);
    assignedTeamLeadName = tl ? `${tl.firstName} ${tl.lastName}` : undefined;
  }

  for (let i = 0; i < importedLeads.length; i++) {
    const row = importedLeads[i];
    const rowNum = i + 1;

    if (!row.customerName || !row.phone) {
      importRecord.errorDetails.push({
        row: rowNum,
        phone: row.phone,
        error: 'Missing required field: customerName or phone'
      });
      importRecord.errorCount++;
      continue;
    }

    const cleanPhone = String(row.phone).replace(/[\s-]/g, '');
    const duplicate = db.leads.find(l => l.phone.replace(/[\s-]/g, '') === cleanPhone);
    if (duplicate) {
      importRecord.errorDetails.push({
        row: rowNum,
        phone: row.phone,
        error: `Lead with this phone already exists (${duplicate.customerName})`
      });
      importRecord.errorCount++;
      continue;
    }

    const newLeadNumber = 'LEAD-' + String(db.leads.length + 1).padStart(3, '0');
    const newLead: Lead = {
      id: 'lead-' + Date.now() + '-' + i,
      leadIdNumber: newLeadNumber,
      customerName: String(row.customerName).trim(),
      phone: String(row.phone).trim(),
      email: row.email ? String(row.email).trim() : '',
      companyName: row.companyName ? String(row.companyName).trim() : 'Industrial Client',
      productInterests: Array.isArray(row.productInterests) ? row.productInterests : [row.productInterests || 'Water Treatment'],
      leadSource: row.leadSource || 'import',
      leadStatus: 'new',
      priority: row.priority || 'medium',
      leadValue: Number(row.leadValue) || 250000,
      location: row.location || 'NCR Region',
      industryType: row.industryType || 'Engineering & Manufacturing',
      customerNotes: row.customerNotes || 'Imported via CSV/Excel batch',
      assignedTeamLeadId: assignedTeamLeadId || 'usr-lead-1',
      assignedTeamLeadName: assignedTeamLeadName || 'Arun Verma',
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.leads.unshift(newLead);
    importRecord.successCount++;
  }

  db.leadImports.unshift(importRecord);
  db.logActivity(currentUser, `imported ${importRecord.successCount} leads from ${filename}`, 'lead', undefined, `Success: ${importRecord.successCount}, Failed: ${importRecord.errorCount}`);

  return res.status(202).json({
    message: `Batch processed: ${importRecord.successCount} leads imported, ${importRecord.errorCount} skipped/failed`,
    import_record: importRecord
  });
});

app.get('/api/v1/leads/import/:id/status', (req: Request, res: Response) => {
  const record = db.leadImports.find(r => r.id === req.params.id);
  if (!record) {
    return sendError(res, 404, 'NOT_FOUND', 'Import batch record not found');
  }
  return res.json(record);
});

// ==========================================
// 3. EMPLOYEE & TEAM ENDPOINTS
// ==========================================

app.get('/api/v1/employees', (req: Request, res: Response) => {
  const { role, status, team_id, search } = req.query;
  let results = db.users.map(u => {
    const copy = { ...u };
    delete (copy as any).passwordHash;
    return copy;
  });

  if (role && role !== 'all') {
    results = results.filter(u => u.role === role);
  }
  if (status && status !== 'all') {
    results = results.filter(u => u.status === status);
  }
  if (team_id) {
    results = results.filter(u => u.teamId === team_id);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(u =>
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.designation.toLowerCase().includes(q)
    );
  }

  return res.json({ employees: results, total: results.length });
});

app.get('/api/v1/employees/:id', (req: Request, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return sendError(res, 404, 'NOT_FOUND', 'Employee not found');
  }

  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;

  const assignedLeads = db.leads.filter(l => l.assignedTelecallerId === user.id || l.assignedTeamLeadId === user.id);
  const callLogs = db.callLogs.filter(c => c.userId === user.id);
  const contacted = assignedLeads.filter(l => l.leadStatus !== 'new').length;
  const converted = assignedLeads.filter(l => l.leadStatus === 'converted').length;
  const totalRevenue = assignedLeads.filter(l => l.leadStatus === 'converted').reduce((sum, l) => sum + (l.leadValue || 0), 0);

  const performance = {
    leads_assigned: assignedLeads.length,
    calls_made: callLogs.length,
    total_call_duration_mins: Math.round(callLogs.reduce((sum, c) => sum + (c.callDurationSeconds || 0), 0) / 60),
    contacted_leads: contacted,
    conversions: converted,
    conversion_rate: assignedLeads.length > 0 ? ((converted / assignedLeads.length) * 100).toFixed(1) : '0',
    total_revenue_generated: totalRevenue
  };

  return res.json({
    employee: safeUser,
    performance
  });
});

app.post('/api/v1/employees', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { firstName, lastName, email, phone, role, teamId, department = 'Sales', designation = 'Inside Sales Rep' } = req.body;

  if (!firstName || !email) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'First name and email are required');
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return sendError(res, 400, 'DUPLICATE_ERROR', 'An employee with this email already exists');
  }

  const team = db.teams.find(t => t.id === teamId);

  const newEmployee: any = {
    id: 'usr-' + Date.now(),
    email: email.trim().toLowerCase(),
    passwordHash: 'pass@123', // Default initial password
    firstName: firstName.trim(),
    lastName: lastName ? lastName.trim() : '',
    phone: phone ? phone.trim() : '+91 98000 00000',
    role: role || 'telecaller',
    roleId: 'role-' + (role || 'telecaller'),
    teamId: teamId || undefined,
    teamName: team ? team.name : undefined,
    department,
    designation,
    profilePhotoUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=150&auto=format&fit=crop&q=80`,
    status: 'active',
    twoFactorEnabled: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newEmployee);
  if (team) {
    team.memberIds.push(newEmployee.id);
  }

  db.logActivity(currentUser, `created employee account for ${newEmployee.firstName} ${newEmployee.lastName}`, 'user', newEmployee.id, `Role: ${newEmployee.role}`);

  const safeEmployee = { ...newEmployee };
  delete safeEmployee.passwordHash;

  return res.status(201).json({
    message: 'Employee account created',
    employee: safeEmployee
  });
});

app.put('/api/v1/employees/:id', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return sendError(res, 404, 'NOT_FOUND', 'Employee not found');
  }

  const old = db.users[index];
  const updated = { ...old, ...req.body };
  if (req.body.teamId) {
    const team = db.teams.find(t => t.id === req.body.teamId);
    updated.teamName = team ? team.name : old.teamName;
  }

  db.users[index] = updated;
  db.logActivity(currentUser, `updated profile of ${updated.firstName} ${updated.lastName}`, 'user', updated.id);

  const safe = { ...updated };
  delete safe.passwordHash;
  return res.json({ message: 'Employee updated', employee: safe });
});

app.patch('/api/v1/employees/:id/role', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { new_role_id, role } = req.body;
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return sendError(res, 404, 'NOT_FOUND', 'Employee not found');

  const oldRole = user.role;
  user.role = role || (new_role_id?.replace('role-', '') as any);
  user.roleId = new_role_id || ('role-' + user.role);

  db.logActivity(currentUser, `changed role of ${user.firstName} from ${oldRole} to ${user.role}`, 'user', user.id);
  return res.json({ message: 'Role updated successfully', user });
});

app.patch('/api/v1/employees/:id/status', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { status, reason } = req.body;
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return sendError(res, 404, 'NOT_FOUND', 'Employee not found');

  user.status = status;
  db.logActivity(currentUser, `changed status of ${user.firstName} to ${status}`, 'user', user.id, reason);
  return res.json({ message: 'Status updated successfully', user });
});

app.post('/api/v1/employees/:id/reset-password', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return sendError(res, 404, 'NOT_FOUND', 'Employee not found');

  const tempPass = req.body.temporary_password || 'pass@123';
  user.passwordHash = tempPass;
  db.logActivity(currentUser, `reset temporary password for ${user.firstName} ${user.lastName}`, 'user', user.id);
  return res.json({ message: 'Password has been reset to temporary password' });
});

app.get('/api/v1/teams', (req: Request, res: Response) => {
  const teamsWithMembers = db.teams.map(t => {
    const members = db.users.filter(u => t.memberIds.includes(u.id)).map(u => {
      const safe = { ...u };
      delete (safe as any).passwordHash;
      return safe;
    });
    return { ...t, members };
  });
  return res.json({ teams: teamsWithMembers });
});

app.post('/api/v1/teams', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { name, description, teamLeadId } = req.body;
  if (!name || !teamLeadId) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Team name and Team Lead are required');
  }

  const tl = db.users.find(u => u.id === teamLeadId);
  const newTeam = {
    id: 'team-' + Date.now(),
    name: name.trim(),
    description: description || '',
    teamLeadId,
    teamLeadName: tl ? `${tl.firstName} ${tl.lastName}` : 'Unassigned',
    memberIds: [],
    createdAt: new Date().toISOString()
  };

  db.teams.push(newTeam);
  db.logActivity(currentUser, `created team ${newTeam.name}`, 'team', newTeam.id);
  return res.status(201).json({ message: 'Team created', team: newTeam });
});

// ==========================================
// 4. INVENTORY & SUPPLIERS ENDPOINTS
// ==========================================

app.get('/api/v1/inventory/products', (req: Request, res: Response) => {
  const { category, status, search, low_stock_only } = req.query;
  let results = [...db.products];

  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }
  if (status && status !== 'all') {
    results = results.filter(p => p.status === status);
  }
  if (low_stock_only === 'true') {
    results = results.filter(p => p.quantityOnHand <= p.reorderLevel);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  return res.json({ products: results, total: results.length });
});

app.get('/api/v1/inventory/products/:id', (req: Request, res: Response) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return sendError(res, 404, 'NOT_FOUND', 'Product not found');
  }

  const movements = db.inventoryMovements.filter(m => m.productId === product.id);
  return res.json({
    product,
    stock_level: {
      on_hand: product.quantityOnHand,
      reserved: product.quantityReserved,
      available: product.quantityAvailable,
      reorder_level: product.reorderLevel,
      is_low_stock: product.quantityOnHand <= product.reorderLevel
    },
    movement_history: movements
  });
});

app.post('/api/v1/inventory/products', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { sku, name, category, subcategory, costPrice, sellingPrice, reorderLevel = 2, specifications = {}, unitOfMeasure = 'Unit', supplierId } = req.body;

  if (!sku || !name || !costPrice || !sellingPrice) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'SKU, name, cost price, and selling price are required');
  }

  const existing = db.products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
  if (existing) {
    return sendError(res, 400, 'DUPLICATE_ERROR', `A product with SKU "${sku}" already exists`);
  }

  const supplier = db.suppliers.find(s => s.id === supplierId);
  const cost = Number(costPrice);
  const sell = Number(sellingPrice);
  const margin = sell > 0 ? Number((((sell - cost) / sell) * 100).toFixed(2)) : 0;

  const newProduct: any = {
    id: 'prod-' + Date.now(),
    sku: sku.trim().toUpperCase(),
    name: name.trim(),
    category: category || 'Industrial Systems',
    subcategory: subcategory || '',
    description: req.body.description || '',
    specifications,
    unitOfMeasure,
    costPrice: cost,
    sellingPrice: sell,
    marginPercentage: margin,
    taxRate: Number(req.body.taxRate) || 18,
    reorderLevel: Number(reorderLevel),
    quantityOnHand: Number(req.body.initialStock) || 0,
    quantityReserved: 0,
    quantityAvailable: Number(req.body.initialStock) || 0,
    supplierId,
    supplierName: supplier ? supplier.name : undefined,
    status: 'active'
  };

  db.products.push(newProduct);
  db.logActivity(currentUser, `added product ${newProduct.sku} - ${newProduct.name}`, 'product', newProduct.id);

  return res.status(201).json({ message: 'Product added successfully', product: newProduct });
});

app.patch('/api/v1/inventory/:productId/stock', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { movement_type, quantity_change, warehouse_from, warehouse_to, notes, reference_id } = req.body;

  const product = db.products.find(p => p.id === req.params.productId);
  if (!product) {
    return sendError(res, 404, 'NOT_FOUND', 'Product not found');
  }

  const change = Number(quantity_change);
  if (isNaN(change) || change === 0) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Valid quantity change is required');
  }

  // Adjust stock quantity
  product.quantityOnHand = Math.max(0, product.quantityOnHand + change);
  product.quantityAvailable = Math.max(0, product.quantityOnHand - product.quantityReserved);

  const movement = {
    id: 'mov-' + Date.now(),
    productId: product.id,
    productName: product.name,
    movementType: movement_type as MovementType,
    quantityChange: change,
    warehouseFrom: warehouse_from,
    warehouseTo: warehouse_to,
    referenceId: reference_id,
    notes: notes || `Stock ${movement_type} recorded`,
    createdById: currentUser.id,
    createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
    createdAt: new Date().toISOString()
  };

  db.inventoryMovements.unshift(movement);
  db.logActivity(currentUser, `logged stock ${movement_type} of ${change > 0 ? '+' + change : change} units for ${product.name}`, 'inventory', product.id, notes);

  return res.json({
    message: 'Stock updated and movement logged',
    product,
    movement
  });
});

app.get('/api/v1/inventory/low-stock-alerts', (req: Request, res: Response) => {
  const alerts = db.getLowStockAlerts();
  return res.json({ alerts, count: alerts.length });
});

app.get('/api/v1/inventory/movements', (req: Request, res: Response) => {
  return res.json({ movements: db.inventoryMovements, total: db.inventoryMovements.length });
});

app.get('/api/v1/inventory/suppliers', (req: Request, res: Response) => {
  return res.json({ suppliers: db.suppliers });
});

app.post('/api/v1/inventory/suppliers', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { name, contactPerson, email, phone, city, paymentTerms = 'Net 30' } = req.body;

  if (!name) return sendError(res, 400, 'VALIDATION_ERROR', 'Supplier name is required');

  const newSupplier = {
    id: 'sup-' + Date.now(),
    name: name.trim(),
    contactPerson: contactPerson || '',
    email: email || '',
    phone: phone || '',
    address: req.body.address || '',
    city: city || 'Noida',
    state: req.body.state || 'UP',
    postalCode: req.body.postalCode || '201301',
    country: 'India',
    paymentTerms,
    leadTimeDays: Number(req.body.leadTimeDays) || 7,
    status: 'active' as const
  };

  db.suppliers.push(newSupplier);
  db.logActivity(currentUser, `added supplier ${newSupplier.name}`, 'inventory', newSupplier.id);
  return res.status(201).json({ supplier: newSupplier });
});

// ==========================================
// 4B. PARTIES (CUSTOMERS & SUPPLIERS) ENDPOINTS
// ==========================================

app.get('/api/v1/parties', (req: Request, res: Response) => {
  const { partyType, search, status } = req.query;
  let results = [...db.parties];
  if (partyType && partyType !== 'all') {
    results = results.filter(p => p.partyType === partyType);
  }
  if (status && status !== 'all') {
    results = results.filter(p => p.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      p.partyIdNumber.toLowerCase().includes(q)
    );
  }
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ parties: results, total: results.length });
});

app.get('/api/v1/parties/:id', (req: Request, res: Response) => {
  const party = db.parties.find(p => p.id === req.params.id);
  if (!party) return sendError(res, 404, 'NOT_FOUND', 'Party not found');
  const equipment = db.equipment.filter(e => e.partyId === party.id);
  const serviceJobs = db.serviceJobs.filter(j => j.partyId === party.id).sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  const quotations = db.quotations.filter(q => q.partyId === party.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ party, equipment, serviceJobs, quotations });
});

app.post('/api/v1/parties', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { name, phone, partyType = 'customer' } = req.body;
  if (!name || !name.trim()) return sendError(res, 400, 'VALIDATION_ERROR', 'Party name is required');
  if (!phone || !validatePhone(phone)) return sendError(res, 400, 'VALIDATION_ERROR', 'A valid mobile number is required');

  const newParty: Party = {
    id: 'party-' + Date.now(),
    partyIdNumber: db.nextSequence(partyType === 'supplier' ? 'SUPP' : 'CUST', db.parties.filter(p => p.partyType === partyType).length),
    partyType,
    name: name.trim(),
    contactPerson: req.body.contactPerson || '',
    phone: phone.trim(),
    email: req.body.email || '',
    gstin: req.body.gstin || '',
    panNumber: req.body.panNumber || '',
    billingAddress: req.body.billingAddress || '',
    shippingAddress: req.body.shippingAddress || '',
    city: req.body.city || '',
    state: req.body.state || '',
    postalCode: req.body.postalCode || '',
    openingBalance: Number(req.body.openingBalance) || 0,
    balanceType: req.body.balanceType || 'to_collect',
    notes: req.body.notes || '',
    status: 'active',
    createdById: currentUser.id,
    createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.parties.push(newParty);
  db.logActivity(currentUser, `added ${partyType} ${newParty.name}`, 'lead', newParty.id);
  return res.status(201).json({ message: 'Party created successfully', party: newParty });
});

app.put('/api/v1/parties/:id', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const party = db.parties.find(p => p.id === req.params.id);
  if (!party) return sendError(res, 404, 'NOT_FOUND', 'Party not found');
  Object.assign(party, req.body, { id: party.id, updatedAt: new Date().toISOString() });
  db.logActivity(currentUser, `updated party ${party.name}`, 'lead', party.id);
  return res.json({ message: 'Party updated successfully', party });
});

app.delete('/api/v1/parties/:id', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const idx = db.parties.findIndex(p => p.id === req.params.id);
  if (idx === -1) return sendError(res, 404, 'NOT_FOUND', 'Party not found');
  const [removed] = db.parties.splice(idx, 1);
  db.logActivity(currentUser, `deleted party ${removed.name}`, 'lead', removed.id);
  return res.json({ message: 'Party deleted successfully' });
});

// Customer Equipment (water treatment plants owned by customer)
app.post('/api/v1/parties/:id/equipment', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const party = db.parties.find(p => p.id === req.params.id);
  if (!party) return sendError(res, 404, 'NOT_FOUND', 'Party not found');
  const { equipmentName, category } = req.body;
  if (!equipmentName || !category) return sendError(res, 400, 'VALIDATION_ERROR', 'Equipment name and category are required');

  const newEquipment: CustomerEquipment = {
    id: 'equip-' + Date.now(),
    partyId: party.id,
    equipmentName: equipmentName.trim(),
    category,
    make: req.body.make || '',
    model: req.body.model || '',
    capacity: req.body.capacity || '',
    serialNumber: req.body.serialNumber || '',
    installationDate: req.body.installationDate || '',
    warrantyExpiryDate: req.body.warrantyExpiryDate || '',
    amcActive: !!req.body.amcActive,
    amcStartDate: req.body.amcStartDate || '',
    amcEndDate: req.body.amcEndDate || '',
    serviceFrequencyDays: Number(req.body.serviceFrequencyDays) || 90,
    lastServiceDate: req.body.lastServiceDate || '',
    nextDueDate: req.body.nextDueDate || '',
    location: req.body.location || '',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };

  db.equipment.push(newEquipment);
  db.logActivity(currentUser, `added equipment ${newEquipment.equipmentName} for ${party.name}`, 'lead', party.id);
  return res.status(201).json({ message: 'Equipment added successfully', equipment: newEquipment });
});

app.put('/api/v1/equipment/:id', (req: Request, res: Response) => {
  const equipment = db.equipment.find(e => e.id === req.params.id);
  if (!equipment) return sendError(res, 404, 'NOT_FOUND', 'Equipment not found');
  Object.assign(equipment, req.body, { id: equipment.id });
  return res.json({ message: 'Equipment updated successfully', equipment });
});

app.delete('/api/v1/equipment/:id', (req: Request, res: Response) => {
  const idx = db.equipment.findIndex(e => e.id === req.params.id);
  if (idx === -1) return sendError(res, 404, 'NOT_FOUND', 'Equipment not found');
  db.equipment.splice(idx, 1);
  return res.json({ message: 'Equipment deleted successfully' });
});

// ==========================================
// 4C. SERVICE JOBS (AMC / BREAKDOWN / INSTALLATION) ENDPOINTS
// ==========================================

app.get('/api/v1/service-jobs', (req: Request, res: Response) => {
  const { status, partyId, search } = req.query;
  let results = [...db.serviceJobs];
  if (status && status !== 'all') results = results.filter(j => j.status === status);
  if (partyId) results = results.filter(j => j.partyId === partyId);
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(j =>
      (j.partyName || '').toLowerCase().includes(q) ||
      j.jobIdNumber.toLowerCase().includes(q) ||
      j.workDescription.toLowerCase().includes(q)
    );
  }
  results.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  return res.json({ serviceJobs: results, total: results.length });
});

app.post('/api/v1/service-jobs', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { partyId, jobType, scheduledDate, workDescription } = req.body;
  const party = db.parties.find(p => p.id === partyId);
  if (!party) return sendError(res, 400, 'VALIDATION_ERROR', 'A valid customer/party is required');
  if (!jobType || !scheduledDate || !workDescription) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Job type, scheduled date, and work description are required');
  }
  const equipmentItem = db.equipment.find(e => e.id === req.body.equipmentId);

  const newJob: ServiceJob = {
    id: 'svc-' + Date.now(),
    jobIdNumber: db.nextSequence('SVC', db.serviceJobs.length),
    partyId: party.id,
    partyName: party.name,
    equipmentId: equipmentItem?.id,
    equipmentName: equipmentItem?.equipmentName,
    jobType,
    status: 'scheduled',
    scheduledDate,
    assignedToId: req.body.assignedToId || currentUser.id,
    assignedToName: req.body.assignedToName || `${currentUser.firstName} ${currentUser.lastName}`,
    workDescription: workDescription.trim(),
    partsUsed: [],
    chargeAmount: Number(req.body.chargeAmount) || 0,
    paymentReceived: false,
    engineerNotes: '',
    createdById: currentUser.id,
    createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.serviceJobs.push(newJob);
  db.logActivity(currentUser, `scheduled service job ${newJob.jobIdNumber} for ${party.name}`, 'lead', party.id);
  return res.status(201).json({ message: 'Service job created successfully', serviceJob: newJob });
});

app.put('/api/v1/service-jobs/:id', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const job = db.serviceJobs.find(j => j.id === req.params.id);
  if (!job) return sendError(res, 404, 'NOT_FOUND', 'Service job not found');

  Object.assign(job, req.body, { id: job.id, updatedAt: new Date().toISOString() });

  if (job.status === 'completed' && job.equipmentId) {
    const equipmentItem = db.equipment.find(e => e.id === job.equipmentId);
    if (equipmentItem) {
      equipmentItem.lastServiceDate = job.completedDate || new Date().toISOString();
      if (equipmentItem.serviceFrequencyDays) {
        const next = new Date(equipmentItem.lastServiceDate);
        next.setDate(next.getDate() + equipmentItem.serviceFrequencyDays);
        equipmentItem.nextDueDate = next.toISOString();
      }
    }
  }

  db.logActivity(currentUser, `updated service job ${job.jobIdNumber}`, 'lead', job.partyId);
  return res.json({ message: 'Service job updated successfully', serviceJob: job });
});

app.delete('/api/v1/service-jobs/:id', (req: Request, res: Response) => {
  const idx = db.serviceJobs.findIndex(j => j.id === req.params.id);
  if (idx === -1) return sendError(res, 404, 'NOT_FOUND', 'Service job not found');
  db.serviceJobs.splice(idx, 1);
  return res.json({ message: 'Service job deleted successfully' });
});

// ==========================================
// 4D. QUOTATION MAKER ENDPOINTS
// ==========================================

function computeQuotationTotals(items: any[]) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  const computedItems = items.map((item: any) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const taxPercent = Number(item.taxPercent) || 0;

    const lineBase = qty * rate;
    const lineDiscount = lineBase * (discountPercent / 100);
    const lineTaxable = lineBase - lineDiscount;
    const lineTax = lineTaxable * (taxPercent / 100);
    const lineAmount = lineTaxable + lineTax;

    subtotal += lineBase;
    totalDiscount += lineDiscount;
    totalTax += lineTax;

    return {
      id: item.id || 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      productId: item.productId,
      description: item.description,
      hsnCode: item.hsnCode || '',
      quantity: qty,
      unit: item.unit || 'Unit',
      rate,
      discountPercent,
      taxPercent,
      amount: Number(lineAmount.toFixed(2))
    };
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  return {
    items: computedItems,
    subtotal: Number(subtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2))
  };
}

app.get('/api/v1/quotations', (req: Request, res: Response) => {
  const { status, partyId, search } = req.query;
  let results = [...db.quotations];
  if (status && status !== 'all') results = results.filter(q => q.status === status);
  if (partyId) results = results.filter(q => q.partyId === partyId);
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(item =>
      item.partyName.toLowerCase().includes(q) ||
      item.quotationNumber.toLowerCase().includes(q)
    );
  }
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ quotations: results, total: results.length });
});

app.get('/api/v1/quotations/:id', (req: Request, res: Response) => {
  const quotation = db.quotations.find(q => q.id === req.params.id);
  if (!quotation) return sendError(res, 404, 'NOT_FOUND', 'Quotation not found');
  return res.json({ quotation });
});

app.post('/api/v1/quotations', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { partyId, items, validUntil } = req.body;

  const party = db.parties.find(p => p.id === partyId);
  if (!party) return sendError(res, 400, 'VALIDATION_ERROR', 'A valid customer is required');
  if (!Array.isArray(items) || items.length === 0) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'At least one line item is required');
  }

  const totals = computeQuotationTotals(items);
  const now = new Date().toISOString();
  const year = new Date().getFullYear();

  const newQuotation: Quotation = {
    id: 'qtn-' + Date.now(),
    quotationNumber: `QTN-${year}-${String(db.quotations.length + 1).padStart(4, '0')}`,
    partyId: party.id,
    partyName: party.name,
    partyPhone: party.phone,
    partyAddress: party.billingAddress,
    partyGstin: party.gstin,
    quotationDate: req.body.quotationDate || now,
    validUntil: validUntil || now,
    status: 'draft',
    ...totals,
    termsAndConditions: req.body.termsAndConditions || 'Payment: 50% advance, balance on completion. Prices valid as per quoted validity period. Transportation & installation charges extra unless specified.',
    notes: req.body.notes || '',
    createdById: currentUser.id,
    createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
    createdAt: now,
    updatedAt: now
  };

  db.quotations.push(newQuotation);
  db.logActivity(currentUser, `created quotation ${newQuotation.quotationNumber} for ${party.name}`, 'lead', party.id);
  return res.status(201).json({ message: 'Quotation created successfully', quotation: newQuotation });
});

app.put('/api/v1/quotations/:id', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const quotation = db.quotations.find(q => q.id === req.params.id);
  if (!quotation) return sendError(res, 404, 'NOT_FOUND', 'Quotation not found');

  if (req.body.items) {
    const totals = computeQuotationTotals(req.body.items);
    Object.assign(quotation, totals);
  }

  const { items, ...rest } = req.body;
  Object.assign(quotation, rest, { id: quotation.id, updatedAt: new Date().toISOString() });

  db.logActivity(currentUser, `updated quotation ${quotation.quotationNumber}`, 'lead', quotation.partyId);
  return res.json({ message: 'Quotation updated successfully', quotation });
});

app.patch('/api/v1/quotations/:id/status', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const quotation = db.quotations.find(q => q.id === req.params.id);
  if (!quotation) return sendError(res, 404, 'NOT_FOUND', 'Quotation not found');
  quotation.status = req.body.status;
  quotation.updatedAt = new Date().toISOString();
  db.logActivity(currentUser, `marked quotation ${quotation.quotationNumber} as ${quotation.status}`, 'lead', quotation.partyId);
  return res.json({ message: 'Quotation status updated', quotation });
});

app.delete('/api/v1/quotations/:id', (req: Request, res: Response) => {
  const idx = db.quotations.findIndex(q => q.id === req.params.id);
  if (idx === -1) return sendError(res, 404, 'NOT_FOUND', 'Quotation not found');
  db.quotations.splice(idx, 1);
  return res.json({ message: 'Quotation deleted successfully' });
});

// ==========================================
// 5. DASHBOARD & REPORTS ENDPOINTS
// ==========================================

app.get('/api/v1/dashboard/admin', (req: Request, res: Response) => {
  const kpis = db.getDashboardKPIs();
  const alerts = db.getLowStockAlerts();
  return res.json({ ...kpis, lowStockAlerts: alerts });
});

app.get('/api/v1/reports/leads-summary', (req: Request, res: Response) => {
  const statusCounts: Record<string, number> = {};
  db.leads.forEach(l => {
    statusCounts[l.leadStatus] = (statusCounts[l.leadStatus] || 0) + 1;
  });

  const totalValue = db.leads.reduce((sum, l) => sum + (l.leadValue || 0), 0);
  const convertedValue = db.leads.filter(l => l.leadStatus === 'converted').reduce((sum, l) => sum + (l.leadValue || 0), 0);

  return res.json({
    total_leads: db.leads.length,
    by_status: statusCounts,
    total_pipeline_value: totalValue,
    converted_revenue: convertedValue,
    conversion_rate: db.leads.length > 0 ? Math.round((statusCounts['converted'] || 0) / db.leads.length * 100) : 0
  });
});

app.get('/api/v1/reports/sales-pipeline', (req: Request, res: Response) => {
  const getStageValue = (status: string) =>
    db.leads.filter(l => l.leadStatus === status).reduce((sum, l) => sum + (l.leadValue || 0), 0);

  const stages = [
    { stage: 'New', count: db.leads.filter(l => l.leadStatus === 'new').length, value: getStageValue('new') },
    { stage: 'Contacted', count: db.leads.filter(l => l.leadStatus === 'contacted').length, value: getStageValue('contacted') },
    { stage: 'Interested', count: db.leads.filter(l => l.leadStatus === 'interested').length, value: getStageValue('interested') },
    { stage: 'Qualified', count: db.leads.filter(l => l.leadStatus === 'qualified').length, value: getStageValue('qualified') },
    { stage: 'Converted', count: db.leads.filter(l => l.leadStatus === 'converted').length, value: getStageValue('converted') }
  ];

  const totalConverted = getStageValue('converted');
  const now = new Date();
  const m1 = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(now);
  const m2 = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const m3 = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(now.getFullYear(), now.getMonth() + 2, 1));

  return res.json({
    forecast_months: 3,
    monthly_forecast: [
      { month: m1, projected: Math.round(totalConverted * 1.1), committed: totalConverted },
      { month: m2, projected: Math.round(totalConverted * 1.3), committed: Math.round(totalConverted * 0.9) },
      { month: m3, projected: Math.round(totalConverted * 1.5), committed: Math.round(totalConverted * 0.8) }
    ],
    stages
  });
});

app.get('/api/v1/reports/inventory-status', (req: Request, res: Response) => {
  const totalValuation = db.products.reduce((sum, p) => sum + (p.costPrice * p.quantityOnHand), 0);
  const potentialRevenue = db.products.reduce((sum, p) => sum + (p.sellingPrice * p.quantityOnHand), 0);
  const lowStockCount = db.products.filter(p => p.quantityOnHand <= p.reorderLevel).length;

  return res.json({
    total_products: db.products.length,
    total_inventory_valuation: totalValuation,
    potential_market_revenue: potentialRevenue,
    low_stock_products_count: lowStockCount,
    critical_alerts: db.getLowStockAlerts()
  });
});

// ==========================================
// 6. SETTINGS, ROLES & AUDIT LOGS ENDPOINTS
// ==========================================

app.get(['/api/v1/health', '/api/health'], (req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    database: {
      connected: true,
      usersCount: db.users.length,
      leadsCount: db.leads.length,
      productsCount: db.products.length,
      activityLogsCount: db.activityLogs.length
    }
  });
});

app.get('/api/v1/settings', (req: Request, res: Response) => {
  return res.json({ settings: db.systemSettings });
});

app.patch('/api/v1/settings/:key', (req: Request, res: Response) => {
  const currentUser = extractUserFromHeader(req) || db.users[0];
  const { key } = req.params;
  const { setting_value } = req.body;

  db.systemSettings[key] = setting_value;
  db.logActivity(currentUser, `updated system setting "${key}"`, 'lead', undefined, JSON.stringify(setting_value));

  return res.json({ message: 'Setting updated', key, value: setting_value });
});

app.get('/api/v1/roles', (req: Request, res: Response) => {
  return res.json({ roles: db.roles });
});

app.get('/api/v1/activity-logs', (req: Request, res: Response) => {
  const { entity_type, user_id, search, limit = '50' } = req.query;
  let results = [...db.activityLogs];

  if (entity_type) {
    results = results.filter(a => a.entityType === entity_type);
  }
  if (user_id) {
    results = results.filter(a => a.userId === user_id);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(a =>
      (a.action && a.action.toLowerCase().includes(q)) ||
      (a.userName && a.userName.toLowerCase().includes(q)) ||
      (a.entityType && a.entityType.toLowerCase().includes(q)) ||
      (a.details && a.details.toLowerCase().includes(q))
    );
  }

  const limitNum = parseInt(limit as string, 10) || 50;
  return res.json({ logs: results.slice(0, limitNum), total: results.length });
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Om Jyoti CRM backend running on http://localhost:${PORT}`);
  });
}

startServer();
