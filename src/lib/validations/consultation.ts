import { z } from 'zod';

// ============================================================
// CREATE CONSULTATION SCHEMA
// ============================================================

export const CreateConsultationSchema = z.object({
  doctor_id: z.string().uuid('ID de médico inválido'),
  scheduled_at: z
    .string()
    .datetime('Data inválida')
    .refine((date) => new Date(date) > new Date(), 'Data deve ser no futuro'),
  type: z.enum(['video', 'chat'], {
    errorMap: () => ({ message: 'Tipo de consulta inválido' }),
  }),
  chief_complaint: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(1000, 'Descrição muito longa'),
});

// ============================================================
// UPDATE CONSULTATION STATUS SCHEMA
// ============================================================

export const UpdateConsultationStatusSchema = z.object({
  status: z.enum(['cancelled_patient', 'confirmed', 'no_show'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  reason: z.string().optional(),
});

// ============================================================
// START CONSULTATION SCHEMA
// ============================================================

export const StartConsultationSchema = z.object({
  // No validation needed - just confirms consultation can start
});

// ============================================================
// END CONSULTATION SCHEMA
// ============================================================

export const EndConsultationSchema = z.object({
  duration_minutes: z
    .number()
    .int('Duração deve ser inteiro')
    .min(1, 'Duração mínima é 1 minuto')
    .max(120, 'Duração máxima é 120 minutos'),
});

// ============================================================
// TYPES
// ============================================================

export type CreateConsultationInput = z.infer<typeof CreateConsultationSchema>;
export type UpdateConsultationStatusInput = z.infer<typeof UpdateConsultationStatusSchema>;
export type StartConsultationInput = z.infer<typeof StartConsultationSchema>;
export type EndConsultationInput = z.infer<typeof EndConsultationSchema>;
