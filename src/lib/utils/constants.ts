// ============================================================
// FINANCIAL
// ============================================================

export const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% fee
export const MIN_CONSULTATION_PRICE_CENTS = 5000; // R$ 50
export const MAX_CONSULTATION_PRICE_CENTS = 50000; // R$ 500
export const MIN_WITHDRAWAL_CENTS = 10000; // R$ 100

// ============================================================
// CONSULTATION
// ============================================================

export const MIN_HOURS_BEFORE_CANCELLATION = 2;
export const SLOT_DURATION_MINUTES = 30;
export const MAX_CONSULTATION_DURATION_MINUTES = 120;
export const CONSULTATION_TIMEOUT_MINUTES = 60; // Cancel if no-show

// ============================================================
// PAYMENT
// ============================================================

export const ASAAS_WEBHOOK_TIMEOUT_SECONDS = 5;
export const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';
export const ASAAS_PRODUCTION_URL = 'https://api.asaas.com/v3';
export const ASAAS_ENVIRONMENT = process.env.NEXT_PUBLIC_ASAAS_ENVIRONMENT || 'sandbox';

// ============================================================
// VIDEO CALL
// ============================================================

export const DAILY_ROOM_PREFIX = process.env.DAILY_ROOM_NAME_PREFIX || 'aloclinica';
export const DAILY_ROOM_EXPIRY_HOURS = 24;
export const DAILY_MAX_PARTICIPANTS = 2;

// ============================================================
// KYC
// ============================================================

export const KYC_LEVEL_BASIC = 1;
export const KYC_LEVEL_FULL = 2;
export const KYC_MAX_ATTEMPTS = 3;

// ============================================================
// LGPD
// ============================================================

export const LGPD_REQUEST_RESPONSE_DAYS = 15;
export const LGPD_DATA_RETENTION_YEARS_MEDICAL = 20;
export const LGPD_DATA_RETENTION_YEARS_AUDIT = 5;

// ============================================================
// SUPPORT
// ============================================================

export const SUPPORT_SLA_URGENT_MINUTES = 5;
export const SUPPORT_SLA_HIGH_HOURS = 2;
export const SUPPORT_SLA_MEDIUM_HOURS = 24;
export const SUPPORT_SLA_LOW_HOURS = 48;

// ============================================================
// EMAIL
// ============================================================

export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@aloclinica.com.br';
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'AloClínica';

// ============================================================
// URLS
// ============================================================

export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// ============================================================
// PAGINATION
// ============================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================
// ERROR MESSAGES
// ============================================================

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Não autorizado. Faça login para continuar.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Erro na validação dos dados.',
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  CONSULTATION_NOT_AVAILABLE: 'Horário não está disponível. Escolha outro horário.',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente para realizar esta operação.',
  PAYMENT_FAILED: 'Falha ao processar pagamento. Tente novamente.',
  KYCDOC_UPLOAD_FAILED: 'Erro ao enviar documentos. Tente novamente.',
  ROOM_CREATION_FAILED: 'Erro ao criar sala de videochamada. Tente novamente.',
  EMAIL_SEND_FAILED: 'Erro ao enviar email. Tente novamente mais tarde.',
} as const;

// ============================================================
// SUCCESS MESSAGES
// ============================================================

export const SUCCESS_MESSAGES = {
  CONSULTATION_CREATED: 'Consulta agendada com sucesso.',
  CONSULTATION_CANCELLED: 'Consulta cancelada.',
  PAYMENT_CONFIRMED: 'Pagamento confirmado com sucesso.',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso.',
  KYC_SUBMITTED: 'Documentos enviados para análise.',
  PRESCRIPTION_CREATED: 'Receita criada com sucesso.',
} as const;
