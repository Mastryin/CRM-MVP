
export type Role = 'superadmin' | 'team_member';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Status {
  id: string;
  label: string;
  slug: string;
  color: string;
  order: number;
  requires_payment: boolean;
  requires_rejection_reason: boolean;
}

export interface Lead {
  id: string;
  version: number; // For Optimistic Locking
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  country_code: string;
  phone_raw: string;
  phone_normalized: string;
  status: string;
  status_updated_at?: string;
  source?: string;
  source_details?: Record<string, any>;
  assigned_to?: string; // User ID
  tags: string[];
  custom_fields?: Record<string, any>;
  payment_details?: {
    amount: number;
    mode: string; // 'UPI' | 'Card' | 'NetBanking' | 'EMI'
    transaction_id: string;
    coupon_code?: string;
    payment_date?: string;
    emi_details?: {
        tenure: string;
        monthly_amount: number;
        next_payment_date: string;
    };
  };
  rejection_reason?: string;
  merged_identities?: {
    emails: string[];
    names: string[];
  };
  created_at: string;
  created_by?: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_by?: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  event_type: string;
  event_data?: any;
  performed_by: string; // User ID or 'system'
  timestamp: string;
  notes?: string;
}

export interface AssignmentRotation {
  id: number;
  last_assigned_user_id: string | null;
  eligible_user_ids: string[];
  updated_at: string;
}

export interface CallLog extends Activity {
  event_type: 'call_logged';
  event_data: {
    duration: string;
    status: 'Completed' | 'No-Show' | 'Cancelled' | 'Rescheduled';
    recording_url?: string;
    source?: string;
  };
}

export interface TrafftAppointment {
  id: number;
  status: 'approved' | 'pending' | 'canceled' | 'rejected' | 'completed';
  bookingType: string;
  createdAt: string;
  updatedAt: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  duration: number;
  service: {
    id: number;
    name: string;
    description: string;
    price: number;
    currency: string;
  };
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    timeZone: string;
  };
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  location: {
    type: string;
    value: string;
    meetingUrl?: string;
  };
  payment: {
    status: string;
    amount: number;
    currency: string;
    paymentGateway: string | null;
    transactionId: string | null;
  };
  customFields: {
    id: number;
    label: string;
    value: string;
  }[];
  notes: string;
  source: string;
}

export interface FilterState {
  search: string;
  source: string[];
  tags: string[];
  status: string[];
  assignee: string[];
  dateRange: string; // '7d', '30d', 'all'
}

export interface EmailTemplate {
  id: string;
  name: string;
  status_trigger: string;
  subject: string;
  body: string;
  is_active: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password_encrypted: string;
  encryption: 'TLS' | 'SSL' | 'NONE';
  from_name: string;
  from_email: string;
  is_configured: boolean;
  last_tested?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  status_trigger: string;
  template_id: string;
  template_preview: string;
  variable_mapping: Record<string, string>;
  is_active: boolean;
}

export interface WebhookConfig {
  id: string;
  name: string;
  webhook_url: string;
  triggers: string[];
  is_active: boolean;
  last_triggered?: string;
}

export interface IntegrationConfig {
  provider: 'pabbly' | 'trafft' | 'deftform' | 'encharge' | 'aisensy' | 'google_sheets';
  enabled: boolean;
  settings: Record<string, any>;
}

export interface Backup {
  id: string;
  filename: string;
  file_size_bytes: number;
  backup_date: string;
  created_by: string;
  download_url: string;
}

export interface SystemMetrics {
  total_leads: number;
  new_leads_today: number;
  webhook_success_rate: number;
  email_delivery_rate: number;
  active_users: number;
  db_size_bytes: number;
}
