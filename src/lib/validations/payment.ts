import { z } from 'zod';

// ============================================================
// CREATE PAYMENT SCHEMA
// ============================================================

export const CreatePaymentSchema = z
  .object({
    consultation_id: z.string().uuid('ID de consulta inválido'),
    method: z.enum(['pix', 'credit_card'], {
      errorMap: () => ({ message: 'Método de pagamento inválido' }),
    }),
    // Campos de cartão (obrigatório se method = credit_card)
    card_name: z.string().optional(),
    card_number: z.string().optional(),
    card_expiry_month: z.number().int().min(1).max(12).optional(),
    card_expiry_year: z.number().int().min(2024).max(2099).optional(),
    card_ccv: z.string().length(3, 'CVV inválido').optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'credit_card') {
        return (
          data.card_name &&
          data.card_number &&
          data.card_expiry_month &&
          data.card_expiry_year &&
          data.card_ccv
        );
      }
      return true;
    },
    {
      message: 'Dados do cartão obrigatórios para pagamento em cartão',
      path: ['card_name'],
    },
  );

// ============================================================
// ASAAS WEBHOOK SCHEMA
// ============================================================

export const AsaasWebhookSchema = z.object({
  event: z.enum([
    'PAYMENT_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_OVERDUE',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
    'PAYMENT_CHARGEBACK',
    'PAYMENT_CHARGEBACK_DISPUTE',
  ]),
  payment: z.object({
    id: z.string(),
    object: z.string(),
    dateCreated: z.string(),
    customer: z.string(),
    paymentDate: z.string().optional(),
    value: z.number(),
    netValue: z.number(),
    status: z.enum([
      'PENDING',
      'CONFIRMED',
      'RECEIVED',
      'OVERDUE',
      'REFUNDED',
      'FAILED',
      'CHARGEBACK',
      'CHARGEBACK_DISPUTE',
      'AWAITING_RISK_ANALYSIS',
    ]),
    confirmedDate: z.string().optional(),
    billingType: z.string(),
    pixTransaction: z.string().optional(),
  }),
});

// ============================================================
// REFUND SCHEMA
// ============================================================

export const RefundSchema = z.object({
  payment_id: z.string().uuid('ID de pagamento inválido'),
  amount_cents: z
    .number()
    .int('Valor deve ser inteiro')
    .min(100, 'Valor mínimo é R$ 1.00'),
  reason: z.string().optional(),
});

// ============================================================
// TYPES
// ============================================================

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type AsaasWebhookInput = z.infer<typeof AsaasWebhookSchema>;
export type RefundInput = z.infer<typeof RefundSchema>;
