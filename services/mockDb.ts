
import { v4 as uuidv4 } from 'uuid';
import { User, Lead, Activity, AssignmentRotation, EmailTemplate, SmtpConfig, WhatsAppTemplate, WebhookConfig, Backup, SystemMetrics, IntegrationConfig, TrafftAppointment } from '../types';
import { DEFAULT_STATUSES, SUPERADMIN_EMAIL, DEFAULT_EMAIL_TEMPLATES, DEFAULT_WHATSAPP_TEMPLATES } from '../constants';
import { normalizePhone } from '../utils/helpers';

const KEYS = {
  USERS: 'mastry_users',
  LEADS: 'mastry_leads',
  ACTIVITIES: 'mastry_activities',
  ROTATION: 'mastry_rotation',
  EMAIL_TEMPLATES: 'mastry_email_templates',
  SMTP_CONFIG: 'mastry_smtp_config',
  WHATSAPP_TEMPLATES: 'mastry_whatsapp_templates',
  WEBHOOKS: 'mastry_webhooks',
  INTEGRATIONS: 'mastry_integrations',
  BACKUPS: 'mastry_backups',
  TRASH: 'mastry_trash',
  TAGS: 'mastry_defined_tags',
  INIT: 'mastry_initialized'
};

const INITIAL_ROTATION: AssignmentRotation = {
  id: 1,
  last_assigned_user_id: null,
  eligible_user_ids: [],
  updated_at: new Date().toISOString()
};

const MOCK_TRAFFT_APPOINTMENTS: TrafftAppointment[] = [
    {
      id: 987654,
      status: "approved",
      bookingType: "call",
      createdAt: "2026-01-17T15:42:21Z",
      updatedAt: "2026-01-17T15:42:21Z",
      startDateTime: "2026-01-20T10:00:00Z",
      endDateTime: "2026-01-20T10:30:00Z",
      timeZone: "Asia/Kolkata",
      duration: 30,
      service: {
        id: 1122,
        name: "Free Discovery Call",
        description: "30-min introductory call",
        price: 0,
        currency: "INR"
      },
      customer: {
        id: 445566,
        firstName: "Aman",
        lastName: "Sharma",
        email: "aman.sharma@gmail.com",
        phone: "+91-9876543210",
        timeZone: "Asia/Kolkata"
      },
      employee: {
        id: 778899,
        firstName: "Rohan",
        lastName: "Mishra",
        email: "rohan@mastry.com"
      },
      location: {
        type: "online",
        value: "Google Meet",
        meetingUrl: "https://meet.google.com/abc-defg-hij"
      },
      payment: {
        status: "paid",
        amount: 0,
        currency: "INR",
        paymentGateway: null,
        transactionId: null
      },
      customFields: [
        { id: 1, label: "Current Role", value: "UI Designer" },
        { id: 2, label: "Primary Goal", value: "Switch to Product Design" }
      ],
      notes: "Looking to understand portfolio gaps",
      source: "booking_page"
    },
    {
      id: 987655,
      status: "canceled",
      bookingType: "call",
      createdAt: "2026-01-18T09:15:00Z",
      updatedAt: "2026-01-19T11:00:00Z",
      startDateTime: "2026-01-21T14:00:00Z",
      endDateTime: "2026-01-21T14:45:00Z",
      timeZone: "Asia/Kolkata",
      duration: 45,
      service: {
        id: 1133,
        name: "Portfolio Review",
        description: "In-depth review of current portfolio",
        price: 999,
        currency: "INR"
      },
      customer: {
        id: 445567,
        firstName: "Priya",
        lastName: "Singh",
        email: "priya.singh@example.com",
        phone: "+91-9988776655",
        timeZone: "Asia/Kolkata"
      },
      employee: {
        id: 778899,
        firstName: "Rohan",
        lastName: "Mishra",
        email: "rohan@mastry.com"
      },
      location: {
        type: "online",
        value: "Zoom",
        meetingUrl: "https://zoom.us/j/123456789"
      },
      payment: {
        status: "pending",
        amount: 999,
        currency: "INR",
        paymentGateway: "Stripe",
        transactionId: "pi_123456789"
      },
      customFields: [
        { id: 1, label: "Current Role", value: "Student" },
        { id: 2, label: "Portfolio Link", value: "behance.net/priyasingh" }
      ],
      notes: "Rescheduled from last week.",
      source: "manual_entry"
    }
];

const initializeDb = () => {
  if (localStorage.getItem(KEYS.INIT)) return;

  const superAdmin: User = {
    id: uuidv4(),
    email: SUPERADMIN_EMAIL,
    full_name: 'Rohan Mishra',
    role: 'superadmin',
    is_active: true,
    created_at: new Date().toISOString()
  };

  localStorage.setItem(KEYS.USERS, JSON.stringify([superAdmin]));
  
  const rotation = { ...INITIAL_ROTATION, eligible_user_ids: [superAdmin.id] };
  localStorage.setItem(KEYS.ROTATION, JSON.stringify(rotation));
  
  localStorage.setItem(KEYS.LEADS, JSON.stringify([]));
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify([]));
  
  localStorage.setItem(KEYS.EMAIL_TEMPLATES, JSON.stringify(DEFAULT_EMAIL_TEMPLATES));
  localStorage.setItem(KEYS.WHATSAPP_TEMPLATES, JSON.stringify(DEFAULT_WHATSAPP_TEMPLATES));
  localStorage.setItem(KEYS.WEBHOOKS, JSON.stringify([]));
  
  // Initialize integrations with defaults
  const defaultIntegrations: IntegrationConfig[] = [
      { provider: 'trafft', enabled: false, settings: { api_url: '', client_id: '', client_secret: '' } },
      { provider: 'deftform', enabled: false, settings: { api_key: '' } },
      { provider: 'encharge', enabled: false, settings: { api_key: '', write_key: '' } },
      { provider: 'aisensy', enabled: false, settings: { app_id: '', api_key: '' } },
      { provider: 'google_sheets', enabled: false, settings: { spreadsheet_id: '', sheet_name: 'Leads' } }
  ];
  localStorage.setItem(KEYS.INTEGRATIONS, JSON.stringify(defaultIntegrations));
  
  localStorage.setItem(KEYS.BACKUPS, JSON.stringify([]));
  localStorage.setItem(KEYS.SMTP_CONFIG, JSON.stringify({ is_configured: false }));
  localStorage.setItem(KEYS.TAGS, JSON.stringify([]));

  localStorage.setItem(KEYS.INIT, 'true');
};

initializeDb();

const get = <T>(key: string): T => JSON.parse(localStorage.getItem(key) || '[]');
const set = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// Auth & User Services
export const mockLogin = async (email: string, password: string): Promise<User | null> => {
  if (password !== 'password123') throw new Error("Invalid password (use 'password123')");
  const users = get<User[]>(KEYS.USERS);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("User not found");
  if (!user.is_active) throw new Error("Account is inactive");
  user.last_login = new Date().toISOString();
  set(KEYS.USERS, users);
  return user;
};

export const getUsers = (): User[] => get<User[]>(KEYS.USERS);

export const inviteUser = (email: string, full_name: string, role: 'team_member' | 'superadmin') => {
  const users = get<User[]>(KEYS.USERS);
  if (users.find(u => u.email === email)) throw new Error("User already exists");
  const newUser: User = {
    id: uuidv4(),
    email,
    full_name,
    role,
    is_active: true,
    created_at: new Date().toISOString()
  };
  users.push(newUser);
  set(KEYS.USERS, users);
  
  const rotation = JSON.parse(localStorage.getItem(KEYS.ROTATION) || JSON.stringify(INITIAL_ROTATION));
  if (!rotation.eligible_user_ids.includes(newUser.id)) {
    rotation.eligible_user_ids.push(newUser.id);
    localStorage.setItem(KEYS.ROTATION, JSON.stringify(rotation));
  }
  return newUser;
};

export const deleteUser = (userId: string) => {
  const users = get<User[]>(KEYS.USERS);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error("User not found");
  const user = users[userIndex];

  if (user.role === 'superadmin') {
      const activeSuperAdmins = users.filter(u => u.role === 'superadmin' && u.is_active && u.id !== userId);
      if (activeSuperAdmins.length === 0) {
          throw new Error("Cannot delete the last SuperAdmin account.");
      }
  }

  user.is_active = false;
  set(KEYS.USERS, users);
  
  const rotation = JSON.parse(localStorage.getItem(KEYS.ROTATION) || JSON.stringify(INITIAL_ROTATION));
  rotation.eligible_user_ids = rotation.eligible_user_ids.filter((id: string) => id !== userId);
  localStorage.setItem(KEYS.ROTATION, JSON.stringify(rotation));
};

export const resetUserPassword = (userId: string) => {
    // In production this would send an email
    console.log(`Password reset link sent to user ${userId}`);
    return true; 
};

export const toggleUserStatus = (userId: string) => {
    const users = get<User[]>(KEYS.USERS);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User not found");
    
    users[index].is_active = !users[index].is_active;
    set(KEYS.USERS, users);
    
    // Update rotation
    const rotation = JSON.parse(localStorage.getItem(KEYS.ROTATION) || JSON.stringify(INITIAL_ROTATION));
    if (users[index].is_active) {
        if (!rotation.eligible_user_ids.includes(userId)) rotation.eligible_user_ids.push(userId);
    } else {
        rotation.eligible_user_ids = rotation.eligible_user_ids.filter((id: string) => id !== userId);
    }
    localStorage.setItem(KEYS.ROTATION, JSON.stringify(rotation));
    
    return users[index];
};

// Rotation Service
const getNextAgent = (): string | undefined => {
  const rotation = JSON.parse(localStorage.getItem(KEYS.ROTATION) || JSON.stringify(INITIAL_ROTATION));
  const { eligible_user_ids, last_assigned_user_id } = rotation;
  
  if (eligible_user_ids.length === 0) return undefined;
  
  let nextIndex = 0;
  if (last_assigned_user_id) {
    const currentIndex = eligible_user_ids.indexOf(last_assigned_user_id);
    if (currentIndex !== -1) {
      nextIndex = (currentIndex + 1) % eligible_user_ids.length;
    }
  } else {
      nextIndex = 0;
  }

  const nextUserId = eligible_user_ids[nextIndex];
  rotation.last_assigned_user_id = nextUserId;
  rotation.updated_at = new Date().toISOString();
  localStorage.setItem(KEYS.ROTATION, JSON.stringify(rotation));
  return nextUserId;
};

// Lead Service
export const getLeads = (): Lead[] => get<Lead[]>(KEYS.LEADS).filter(l => !l.deleted_at);
export const getDeletedLeads = (): Lead[] => get<Lead[]>(KEYS.LEADS).filter(l => l.deleted_at);

export const checkDuplicateLead = (phoneInput: string) => {
  const normalized = normalizePhone(phoneInput);
  const leads = get<Lead[]>(KEYS.LEADS);
  const existing = leads.find(l => l.phone_normalized === normalized && !l.deleted_at);
  return { exists: !!existing, lead: existing, normalizedPhone: normalized };
};

export const createLead = (data: Partial<Lead>, createdByUserId: string) => {
  const normalizedPhone = normalizePhone(data.phone_raw || '', data.country_code);
  const { exists } = checkDuplicateLead(data.phone_raw || '');
  if (exists) throw new Error("Duplicate lead detected");

  const assignedTo = getNextAgent();
  
  // Demo Data Injection for Source Cards based on Source
  let sourceDetails = data.source_details || {};
  if (data.source === 'Meta Form') {
      sourceDetails = {
          "Meta Lead Form": { "ad_id": "123456", "form_id": "98765", "question_1": "5+ Years Exp", "question_2": "Bangalore" }
      };
  } else if (data.source === 'Deftform') {
      sourceDetails = {
          "Deftform Submission": { "submitted_at": new Date().toISOString(), "referrer": "LinkedIn", "interest_level": "High" }
      };
  }

  const newLead: Lead = {
    id: uuidv4(),
    version: 1,
    first_name: data.first_name!,
    last_name: data.last_name!,
    full_name: `${data.first_name} ${data.last_name}`,
    email: data.email!,
    country_code: data.country_code || '+91',
    phone_raw: data.phone_raw!,
    phone_normalized: normalizedPhone,
    status: 'new_lead',
    source: data.source || 'Manual Entry',
    source_details: sourceDetails,
    tags: data.tags || [],
    custom_fields: data.custom_fields || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: createdByUserId,
    assigned_to: assignedTo
  };
  const leads = get<Lead[]>(KEYS.LEADS);
  leads.push(newLead);
  set(KEYS.LEADS, leads);
  logActivity(newLead.id, 'lead_created', { source: newLead.source }, createdByUserId);
  triggerWebhook('lead_created', newLead);
  return newLead;
};

export const updateLead = (leadId: string, updates: Partial<Lead>, userId: string, silent: boolean = false, lastKnownVersion?: number) => {
  const leads = get<Lead[]>(KEYS.LEADS);
  const index = leads.findIndex(l => l.id === leadId);
  if (index === -1) throw new Error("Lead not found");

  const oldLead = leads[index];
  
  if (lastKnownVersion !== undefined && oldLead.version !== lastKnownVersion) {
      throw new Error(`Conflict detected! This lead was updated by someone else (v${oldLead.version}). Please reload.`);
  }

  const updatedLead = { 
      ...oldLead, 
      ...updates, 
      version: oldLead.version + 1,
      updated_at: new Date().toISOString() 
  };
  
  if (updates.status && updates.status !== oldLead.status && !silent) {
      updatedLead.status_updated_at = new Date().toISOString();
      logActivity(leadId, 'status_changed', { from: oldLead.status, to: updates.status }, userId);
      triggerWebhook('status_changed', updatedLead);
  } else {
      triggerWebhook('lead_updated', updatedLead);
  }
  
  if (updates.tags && JSON.stringify(updates.tags) !== JSON.stringify(oldLead.tags)) {
      logActivity(leadId, 'tags_updated', { tags: updates.tags }, userId);
  }

  if (updates.payment_details && !oldLead.payment_details) {
      logActivity(leadId, 'payment_added', { amount: updates.payment_details.amount }, userId);
      triggerWebhook('payment_added', updatedLead);
  }
  
  if (updates.assigned_to && updates.assigned_to !== oldLead.assigned_to) {
      logActivity(leadId, 'assigned_to_changed', { from: oldLead.assigned_to, to: updates.assigned_to }, userId);
      triggerWebhook('lead_assigned', updatedLead);
  }

  leads[index] = updatedLead;
  set(KEYS.LEADS, leads);
  return updatedLead;
};

export const mergeLead = (existingLeadId: string, newData: Partial<Lead>, userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const index = leads.findIndex(l => l.id === existingLeadId);
    if (index === -1) throw new Error("Lead not found");
    const existingLead = leads[index];
    const mergedData: any = { ...existingLead };
    
    if (!mergedData.first_name && newData.first_name) mergedData.first_name = newData.first_name;
    if (!mergedData.last_name && newData.last_name) mergedData.last_name = newData.last_name;
    if (!mergedData.email && newData.email) mergedData.email = newData.email;

    const mergedIdentities = existingLead.merged_identities || { emails: [], names: [] };
    if (newData.email && newData.email !== existingLead.email && !mergedIdentities.emails.includes(newData.email)) {
        mergedIdentities.emails.push(newData.email);
    }
    if (newData.first_name && newData.last_name) {
        const newName = `${newData.first_name} ${newData.last_name}`;
        if (newName !== existingLead.full_name && !mergedIdentities.names.includes(newName)) {
             mergedIdentities.names.push(newName);
        }
    }
    mergedData.merged_identities = mergedIdentities;
    if (newData.tags) {
        mergedData.tags = Array.from(new Set([...existingLead.tags, ...newData.tags]));
    }
    if (newData.source_details) {
        mergedData.source_details = { ...existingLead.source_details, ...newData.source_details };
    }

    mergedData.version = existingLead.version + 1;
    mergedData.updated_at = new Date().toISOString();
    leads[index] = mergedData;
    set(KEYS.LEADS, leads);
    logActivity(existingLeadId, 'lead_updated (merged)', { mergedData: newData }, userId);
    triggerWebhook('lead_updated', mergedData);
    return mergedData;
}

// Bulk Operations
export const bulkUpdateLeads = (leadIds: string[], updates: Partial<Lead>, userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const updatedLeads = leads.map(lead => {
        if (leadIds.includes(lead.id)) {
            const updated = { 
                ...lead, 
                ...updates, 
                version: lead.version + 1,
                updated_at: new Date().toISOString() 
            };
             if (updates.status && updates.status !== lead.status) {
                 updated.status_updated_at = new Date().toISOString();
                 logActivity(lead.id, 'status_changed', { from: lead.status, to: updates.status, is_bulk: true }, userId);
                 triggerWebhook('status_changed', updated);
             } else {
                 triggerWebhook('lead_updated', updated);
             }
             return updated;
        }
        return lead;
    });
    set(KEYS.LEADS, updatedLeads);
};

export const bulkAddTags = (leadIds: string[], tags: string[], userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const updatedLeads = leads.map(lead => {
        if (leadIds.includes(lead.id)) {
            const newTags = Array.from(new Set([...lead.tags, ...tags]));
            logActivity(lead.id, 'tags_added', { tags }, userId);
            return { ...lead, tags: newTags, updated_at: new Date().toISOString(), version: lead.version + 1 };
        }
        return lead;
    });
    set(KEYS.LEADS, updatedLeads);
};

export const bulkRemoveTags = (leadIds: string[], tags: string[], userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const updatedLeads = leads.map(lead => {
        if (leadIds.includes(lead.id)) {
            const newTags = lead.tags.filter(t => !tags.includes(t));
            logActivity(lead.id, 'tags_removed', { tags }, userId);
            return { ...lead, tags: newTags, updated_at: new Date().toISOString(), version: lead.version + 1 };
        }
        return lead;
    });
    set(KEYS.LEADS, updatedLeads);
};

export const bulkDeleteLeads = (leadIds: string[], userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const updatedLeads = leads.map(lead => {
        if (leadIds.includes(lead.id)) {
            const deletedLead = { ...lead, deleted_at: new Date().toISOString(), deleted_by: userId };
            triggerWebhook('lead_deleted', deletedLead);
            return deletedLead;
        }
        return lead;
    });
    set(KEYS.LEADS, updatedLeads);
    leadIds.forEach(id => logActivity(id, 'lead_deleted', { is_bulk: true }, userId));
};

export const deleteLead = (leadId: string, userId: string) => {
    bulkDeleteLeads([leadId], userId);
};

export const restoreLead = (leadId: string, userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const index = leads.findIndex(l => l.id === leadId);
    if (index === -1) throw new Error("Lead not found");
    
    leads[index].deleted_at = null;
    leads[index].deleted_by = undefined;
    leads[index].updated_at = new Date().toISOString();
    leads[index].version += 1;
    
    set(KEYS.LEADS, leads);
    logActivity(leadId, 'lead_restored', {}, userId);
    triggerWebhook('lead_updated', leads[index]);
};

export const deleteLeadPermanently = (leadId: string) => {
    let leads = get<Lead[]>(KEYS.LEADS);
    leads = leads.filter(l => l.id !== leadId);
    set(KEYS.LEADS, leads);
};

export const emptyTrash = () => {
    let leads = get<Lead[]>(KEYS.LEADS);
    leads = leads.filter(l => !l.deleted_at);
    set(KEYS.LEADS, leads);
};

export const logActivity = (leadId: string, eventType: string, eventData: any, userId: string) => {
  const activities = get<Activity[]>(KEYS.ACTIVITIES);
  const newActivity: Activity = {
    id: uuidv4(),
    lead_id: leadId,
    event_type: eventType,
    event_data: eventData,
    performed_by: userId,
    timestamp: new Date().toISOString()
  };
  activities.push(newActivity);
  set(KEYS.ACTIVITIES, activities);
  return newActivity;
};

export const getLeadActivities = (leadId: string): Activity[] => {
    return get<Activity[]>(KEYS.ACTIVITIES).filter(a => a.lead_id === leadId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const getAllCallLogs = () => {
    const activities = get<Activity[]>(KEYS.ACTIVITIES).filter(a => a.event_type === 'call_logged');
    const leads = get<Lead[]>(KEYS.LEADS);
    return activities.map(a => {
        const lead = leads.find(l => l.id === a.lead_id);
        return { ...a, lead }; 
    }).filter(item => item.lead).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getEmailTemplates = (): EmailTemplate[] => get<EmailTemplate[]>(KEYS.EMAIL_TEMPLATES);
export const getWhatsAppTemplates = (): WhatsAppTemplate[] => get<WhatsAppTemplate[]>(KEYS.WHATSAPP_TEMPLATES);
export const getWebhooks = (): WebhookConfig[] => get<WebhookConfig[]>(KEYS.WEBHOOKS);
export const getSmtpConfig = (): SmtpConfig => get<SmtpConfig>(KEYS.SMTP_CONFIG);
export const getIntegrations = (): IntegrationConfig[] => get<IntegrationConfig[]>(KEYS.INTEGRATIONS);

export const saveEmailTemplate = (template: EmailTemplate) => {
    const templates = getEmailTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    if (index >= 0) templates[index] = template;
    else templates.push(template);
    set(KEYS.EMAIL_TEMPLATES, templates);
};

export const saveWhatsAppTemplate = (template: WhatsAppTemplate) => {
    const templates = getWhatsAppTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    if (index >= 0) templates[index] = template;
    else templates.push(template);
    set(KEYS.WHATSAPP_TEMPLATES, templates);
};

export const fetchAisensyTemplates = async (apiKey: string): Promise<WhatsAppTemplate[]> => {
    // Simulate API call to Aisensy
    console.log("Fetching Aisensy templates with key:", apiKey);
    return new Promise((resolve) => {
        setTimeout(() => {
            const fetched = DEFAULT_WHATSAPP_TEMPLATES.map(t => ({...t, id: uuidv4()}));
            // Merge into DB
            const current = getWhatsAppTemplates();
            // Simple logic: add new ones
            set(KEYS.WHATSAPP_TEMPLATES, [...current, ...fetched]);
            resolve(fetched);
        }, 1500);
    });
};

export const deleteWhatsAppTemplate = (id: string) => {
    const templates = getWhatsAppTemplates().filter(t => t.id !== id);
    set(KEYS.WHATSAPP_TEMPLATES, templates);
};

export const saveWebhook = (webhook: WebhookConfig) => {
    const webhooks = getWebhooks();
    const index = webhooks.findIndex(w => w.id === webhook.id);
    if (index >= 0) webhooks[index] = webhook;
    else webhooks.push(webhook);
    set(KEYS.WEBHOOKS, webhooks);
};

export const deleteWebhook = (id: string) => {
    const webhooks = getWebhooks().filter(w => w.id !== id);
    set(KEYS.WEBHOOKS, webhooks);
};

export const saveIntegrationConfig = (config: IntegrationConfig) => {
    const integrations = getIntegrations();
    const index = integrations.findIndex(i => i.provider === config.provider);
    if (index >= 0) integrations[index] = config;
    else integrations.push(config);
    set(KEYS.INTEGRATIONS, integrations);
};

export const saveSmtpConfig = (config: SmtpConfig) => {
    set(KEYS.SMTP_CONFIG, config);
};

export const triggerAutomation = (type: 'email' | 'whatsapp', leadId: string, content: string, userId: string) => {
    const rand = Math.random();
    if (rand > 0.2) {
        logActivity(leadId, type === 'email' ? 'email_sent' : 'whatsapp_triggered', { content_snippet: content.substring(0, 50) + '...' }, userId);
    } else {
        const errorTypes = [
            { code: 'EAUTH', msg: 'Email authentication failed. Please check SMTP credentials in Settings.', retry: false },
            { code: 'ETIMEDOUT', msg: 'Email server timed out. Retrying automatically...', retry: true },
            { code: 'ECONNREFUSED', msg: 'Cannot connect to email server. Check SMTP host and port.', retry: false },
            { code: 'ERATELIMIT', msg: 'Email rate limit exceeded. Will retry in 1 hour.', retry: true }
        ];
        const err = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        logActivity(leadId, type === 'email' ? 'email_failed' : 'whatsapp_failed', { 
            error_code: err.code, 
            message: err.msg,
            retryable: err.retry
        }, userId);
        throw new Error(`${type === 'email' ? 'Email' : 'WhatsApp'} Failed: ${err.msg}`);
    }
};

export const triggerWebhook = (event: string, payload: any) => {
    const webhooks = getWebhooks().filter(w => w.is_active && w.triggers.includes(event));
    webhooks.forEach(w => {
        console.log(`[Mock Webhook] Triggering ${w.webhook_url} for ${event}`);
        if (payload.id) {
             const success = Math.random() > 0.1;
             logActivity(payload.id, 'webhook_triggered', {
                 webhook_name: w.name,
                 url: w.webhook_url,
                 status: success ? 200 : 500,
                 latency_ms: Math.floor(Math.random() * 500),
                 response: success ? 'OK' : 'Internal Server Error'
             }, 'system');
        }
    });
};

export const generateBackup = (userId: string) => {
    const backupData = {
        leads: get(KEYS.LEADS),
        users: get(KEYS.USERS),
        activities: get(KEYS.ACTIVITIES),
        emailTemplates: get(KEYS.EMAIL_TEMPLATES),
        config: get(KEYS.SMTP_CONFIG)
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const backup: Backup = {
        id: uuidv4(),
        filename: `mastry_crm_backup_${new Date().toISOString().split('T')[0]}.json`,
        file_size_bytes: blob.size,
        backup_date: new Date().toISOString(),
        created_by: userId,
        download_url: url
    };
    const backups = get<Backup[]>(KEYS.BACKUPS);
    backups.unshift(backup);
    set(KEYS.BACKUPS, backups);
    return backup;
};

export const restoreBackup = (jsonData: any, userId: string) => {
    if (!jsonData.leads || !jsonData.users) throw new Error("Invalid backup file format");
    set(KEYS.LEADS, jsonData.leads);
    set(KEYS.USERS, jsonData.users);
    set(KEYS.ACTIVITIES, jsonData.activities || []);
    if (jsonData.emailTemplates) set(KEYS.EMAIL_TEMPLATES, jsonData.emailTemplates);
    if (jsonData.config) set(KEYS.SMTP_CONFIG, jsonData.config);
    console.log("System restored from backup by " + userId);
};

export const getBackups = (): Backup[] => get<Backup[]>(KEYS.BACKUPS);

export const getSystemMetrics = (): SystemMetrics => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const users = get<User[]>(KEYS.USERS);
    const today = new Date().toISOString().split('T')[0];
    return {
        total_leads: leads.length,
        new_leads_today: leads.filter(l => l.created_at.startsWith(today)).length,
        active_users: users.filter(u => u.is_active).length,
        webhook_success_rate: 98.5,
        email_delivery_rate: 96.2,
        db_size_bytes: new Blob([localStorage.getItem(KEYS.LEADS) || '']).size
    };
};

export const createTag = (tagName: string) => {
    const tags = get<string[]>(KEYS.TAGS);
    if (!tags.includes(tagName)) {
        tags.push(tagName);
        set(KEYS.TAGS, tags);
    }
}

export const mergeTags = (oldTag: string, newTag: string, userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const updatedLeads = leads.map(lead => {
        if (lead.tags.includes(oldTag)) {
            const tags = lead.tags.filter(t => t !== oldTag);
            if (!tags.includes(newTag)) tags.push(newTag);
            logActivity(lead.id, 'tag_merged', { old: oldTag, new: newTag }, userId);
            return { ...lead, tags, updated_at: new Date().toISOString(), version: lead.version + 1 };
        }
        return lead;
    });
    set(KEYS.LEADS, updatedLeads);
    
    // Update explicit tags
    const tags = get<string[]>(KEYS.TAGS);
    const newTagsList = tags.filter(t => t !== oldTag);
    if (!newTagsList.includes(newTag)) newTagsList.push(newTag);
    set(KEYS.TAGS, newTagsList);
};

export const renameTag = (oldTag: string, newTag: string, userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const updatedLeads = leads.map(lead => {
        if (lead.tags.includes(oldTag)) {
            const tags = lead.tags.map(t => t === oldTag ? newTag : t);
            // Dedupe if newTag already existed on the lead
            const uniqueTags = Array.from(new Set(tags));
            logActivity(lead.id, 'tag_renamed', { old: oldTag, new: newTag }, userId);
            return { ...lead, tags: uniqueTags, updated_at: new Date().toISOString(), version: lead.version + 1 };
        }
        return lead;
    });
    set(KEYS.LEADS, updatedLeads);

    const tags = get<string[]>(KEYS.TAGS);
    const index = tags.indexOf(oldTag);
    if (index !== -1) {
        tags[index] = newTag;
    } else {
        tags.push(newTag);
    }
    set(KEYS.TAGS, tags);
}

export const deleteTag = (tag: string, userId: string) => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const updatedLeads = leads.map(lead => {
        if (lead.tags.includes(tag)) {
            const tags = lead.tags.filter(t => t !== tag);
            logActivity(lead.id, 'tag_deleted', { tag }, userId);
            return { ...lead, tags, updated_at: new Date().toISOString(), version: lead.version + 1 };
        }
        return lead;
    });
    set(KEYS.LEADS, updatedLeads);

    const tags = get<string[]>(KEYS.TAGS).filter(t => t !== tag);
    set(KEYS.TAGS, tags);
}

export const getAllTags = () => {
    const leads = get<Lead[]>(KEYS.LEADS);
    const tagCounts: Record<string, number> = {};
    
    // Count from leads
    leads.forEach(l => l.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
    }));

    // Include explicitly created tags even if count is 0
    const explicitTags = get<string[]>(KEYS.TAGS);
    explicitTags.forEach(t => {
        if (tagCounts[t] === undefined) tagCounts[t] = 0;
    });

    return Object.entries(tagCounts).map(([name, count]) => ({ name, count }));
}

export const simulateTrafftCall = (phone: string, userId: string) => {
    const { lead } = checkDuplicateLead(phone);
    if (lead) {
        logActivity(lead.id, 'call_logged', { 
            duration: '15:00', 
            status: 'Completed', 
            notes: 'Synced from Trafft (Mock)',
            source: 'Trafft'
        }, userId);
        return true;
    }
    return false;
};

// Trafft Appointments
export const getTrafftAppointments = (): TrafftAppointment[] => {
    // In a real app this would come from an API or a synced store.
    // We return the static MOCK data here.
    return MOCK_TRAFFT_APPOINTMENTS;
};
