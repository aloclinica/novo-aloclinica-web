/* Auto-generated from schema.sql */

// ============================================================
// ENUMS
// ============================================================

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

export enum KYCStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED_PATIENT = 'cancelled_patient',
  CANCELLED_DOCTOR = 'cancelled_doctor',
  NO_SHOW = 'no_show',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CHARGEBACK = 'chargeback',
}

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  FREE = 'free',
}

export enum LGPDRequestType {
  ACCESS = 'access',
  CORRECTION = 'correction',
  PORTABILITY = 'portability',
  DELETION = 'deletion',
  REVOCATION = 'revocation',
}

export enum SupportCategory {
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  MEDICAL = 'medical',
  LGPD = 'lgpd',
  COMPLAINT = 'complaint',
  OTHER = 'other',
}

// ============================================================
// TABLES
// ============================================================

export interface Profile {
  id: string; // UUID, FK auth.users
  role: UserRole;
  full_name: string;
  cpf: string; // Unique
  birth_date?: string; // YYYY-MM-DD
  phone?: string;
  avatar_url?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    cep: string;
  };
  kyc_level: number;
  kyc_status: KYCStatus;
  kyc_reviewed_at?: string; // TIMESTAMPTZ
  kyc_reviewed_by?: string; // UUID
  lgpd_consent: boolean;
  lgpd_consent_at?: string;
  terms_accepted_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string; // UUID
  name: string; // Unique
  slug: string; // Unique
  icon_url?: string;
  base_price_cents: number;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: string; // UUID, FK profiles
  crm: string;
  crm_state: string;
  rqe?: string;
  bio?: string;
  specialties: string[]; // UUID[]
  languages: string[]; // TEXT[], default ['pt-BR']
  consultation_price_cents: number;
  return_price_cents?: number;
  avg_rating: number;
  total_reviews: number;
  total_consultations: number;
  bank_account?: {
    bankCode: string;
    accountType: string; // 'CONTA_CORRENTE' | 'CONTA_POUPANCA'
    account: string;
    accountDigit: string;
  };
  digital_cert_url?: string;
  is_available: boolean;
  created_at: string;
}

export interface DoctorAvailability {
  id: string; // UUID
  doctor_id: string; // UUID
  day_of_week: number; // 0-6
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Consultation {
  id: string; // UUID
  patient_id: string; // UUID
  doctor_id: string; // UUID
  scheduled_at: string; // TIMESTAMPTZ
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  status: ConsultationStatus;
  type: 'video' | 'chat' | 'return';
  chief_complaint?: string;
  room_url?: string;
  room_token?: string;
  price_cents: number;
  platform_fee_cents?: number;
  doctor_amount_cents?: number;
  payment_status: PaymentStatus;
  payment_id?: string;
  recording_url?: string;
  recording_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string; // UUID
  consultation_id?: string; // UUID, Unique
  patient_id: string; // UUID
  amount_cents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway?: string; // 'asaas', 'stripe'
  gateway_id?: string; // Unique
  gateway_response?: Record<string, any>;
  pix_qr_code?: string;
  pix_expires_at?: string;
  paid_at?: string;
  refunded_at?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string; // UUID
  consultation_id?: string; // UUID
  doctor_id: string; // UUID
  patient_id: string; // UUID
  chief_complaint?: string;
  history?: string;
  physical_exam?: string;
  diagnosis?: string;
  cid_10?: string;
  treatment_plan?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string; // UUID
  consultation_id?: string; // UUID
  doctor_id: string; // UUID
  patient_id: string; // UUID
  type: 'simple' | 'special_white' | 'special_yellow' | 'blue' | 'antimicrobial';
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  digital_signature?: string;
  pdf_url?: string;
  valid_until?: string;
  created_at: string;
}

export interface Review {
  id: string; // UUID
  consultation_id: string; // UUID, Unique
  patient_id: string; // UUID
  doctor_id: string; // UUID
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  is_visible: boolean;
  created_at: string;
}

export interface LGPDConsent {
  id: string; // UUID
  user_id: string; // UUID
  consent_type: string;
  version: string;
  text_shown: string;
  accepted: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface LGPDRequest {
  id: string; // UUID
  user_id: string; // UUID
  type: LGPDRequestType;
  status: string; // 'open' | 'pending' | 'completed'
  description?: string;
  response?: string;
  due_date?: string;
  completed_at?: string;
  handled_by?: string; // UUID
  created_at: string;
}

export interface SupportTicket {
  id: string; // UUID
  user_id: string; // UUID
  consultation_id?: string; // UUID
  category: SupportCategory;
  priority: string; // 'low' | 'medium' | 'high' | 'urgent'
  status: string; // 'open' | 'in_progress' | 'resolved'
  subject: string;
  messages: Array<{
    role: 'user' | 'support';
    message: string;
    created_at: string;
  }>;
  assigned_to?: string; // UUID
  resolved_at?: string;
  satisfaction_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string; // UUID
  user_id: string; // UUID
  type: string; // 'consultation_confirmed', 'prescription_ready', etc.
  title: string;
  body: string;
  data?: Record<string, any>;
  channel: string[]; // 'push' | 'email' | 'sms'
  read: boolean;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string; // UUID
  user_id?: string; // UUID
  action: string;
  resource?: string;
  resource_id?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
