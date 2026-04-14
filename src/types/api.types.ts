import { Profile, Doctor, Consultation, Payment, Specialty } from './database.types';

// ============================================================
// GENERIC API RESPONSE TYPES
// ============================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ============================================================
// AUTH ENDPOINTS
// ============================================================

export interface SignupRequest {
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  full_name: string;
  cpf: string;
  birth_date?: string;
  phone?: string;
  // Médico específico
  crm?: string;
  crm_state?: string;
}

export interface SignupResponse {
  id: string;
  email: string;
  role: string;
  profile: Profile;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  session: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  user: Profile;
}

// ============================================================
// PROFILE ENDPOINTS
// ============================================================

export interface GetProfileResponse extends Profile {}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  address?: Profile['address'];
}

export interface UpdateProfileResponse extends Profile {}

// ============================================================
// DOCTOR ENDPOINTS
// ============================================================

export interface ListDoctorsQuery extends PaginationParams {
  specialty_id?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  language?: string;
  available?: boolean;
}

export interface DoctorPublicProfile extends Omit<Doctor, 'bank_account' | 'digital_cert_url'> {
  profile: Omit<Profile, 'kyc_level' | 'kyc_status' | 'lgpd_consent' | 'address'>;
  avg_rating_count: number;
  recent_reviews?: Array<{
    rating: number;
    comment?: string;
    patient_name: string;
    created_at: string;
  }>;
}

export interface ListDoctorsResponse {
  doctors: DoctorPublicProfile[];
  total: number;
  page: number;
}

export interface DoctorAvailabilitySlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface GetDoctorAvailabilityQuery {
  date: string; // YYYY-MM-DD
}

export interface GetDoctorAvailabilityResponse {
  doctor_id: string;
  date: string;
  slots: DoctorAvailabilitySlot[];
}

// ============================================================
// CONSULTATION ENDPOINTS
// ============================================================

export interface CreateConsultationRequest {
  doctor_id: string;
  scheduled_at: string; // ISO 8601
  type: 'video' | 'chat';
  chief_complaint: string;
}

export interface CreateConsultationResponse extends Consultation {}

export interface ListConsultationsQuery extends PaginationParams {
  status?: string;
  doctor_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface ListConsultationsResponse {
  consultations: (Consultation & {
    doctor_profile?: Profile;
    doctor_info?: Doctor;
  })[];
  total: number;
}

export interface StartConsultationResponse {
  room_url: string;
  room_token: string;
  start_time: string;
}

export interface EndConsultationRequest {
  duration_minutes: number;
}

export interface EndConsultationResponse extends Consultation {}

// ============================================================
// PAYMENT ENDPOINTS
// ============================================================

export interface CreatePaymentRequest {
  consultation_id: string;
  method: 'pix' | 'credit_card';
  card_data?: {
    name: string;
    number: string;
    expiryMonth: number;
    expiryYear: number;
    ccv: string;
  };
}

export interface CreatePaymentResponse extends Payment {
  pix_qr_code?: string;
  pix_expires_at?: string;
}

export interface GetPaymentResponse extends Payment {}

export interface AsaasWebhookPayload {
  event:
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_OVERDUE'
    | 'PAYMENT_FAILED'
    | 'PAYMENT_REFUNDED'
    | 'PAYMENT_CHARGEBACK'
    | 'PAYMENT_CHARGEBACK_DISPUTE';
  payment: {
    id: string;
    object: string;
    dateCreated: string;
    customer: string;
    paymentDate?: string;
    value: number;
    netValue: number;
    status:
      | 'PENDING'
      | 'CONFIRMED'
      | 'RECEIVED'
      | 'OVERDUE'
      | 'REFUNDED'
      | 'FAILED'
      | 'CHARGEBACK'
      | 'CHARGEBACK_DISPUTE'
      | 'AWAITING_RISK_ANALYSIS';
    confirmedDate?: string;
    billingType: string;
    pixTransaction?: string;
  };
}

// ============================================================
// MEDICAL RECORD ENDPOINTS
// ============================================================

export interface CreateMedicalRecordRequest {
  chief_complaint?: string;
  history?: string;
  physical_exam?: string;
  diagnosis?: string;
  cid_10?: string;
  treatment_plan?: string;
  notes?: string;
}

// ============================================================
// PRESCRIPTION ENDPOINTS
// ============================================================

export interface CreatePrescriptionRequest {
  type: 'simple' | 'special_white' | 'special_yellow' | 'blue' | 'antimicrobial';
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
}

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

export interface AdminDashboardResponse {
  kpis: {
    consultations_today: number;
    consultations_completed_today: number;
    revenue_today_cents: number;
    new_users_today: number;
    pending_kyc_count: number;
    support_tickets_open: number;
  };
  charts: {
    consultations_by_hour: Array<{ hour: string; count: number }>;
    revenue_by_day: Array<{ date: string; revenue_cents: number }>;
    specialties_demand: Array<{ specialty: string; count: number }>;
  };
  recent_activities: Array<{
    id: string;
    type: string;
    user_name: string;
    description: string;
    created_at: string;
  }>;
}

export interface ListUsersQuery extends PaginationParams {
  role?: string;
  kyc_status?: string;
  is_active?: boolean;
  search?: string;
}

export interface AdminUserListResponse {
  users: (Profile & {
    doctor_info?: Partial<Doctor>;
  })[];
  total: number;
}

export interface ApproveKYCRequest {
  approved: boolean;
  rejection_reason?: string;
}
