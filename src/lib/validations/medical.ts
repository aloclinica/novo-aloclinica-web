import { z } from 'zod';

// ============================================================
// CREATE MEDICAL RECORD SCHEMA
// ============================================================

export const CreateMedicalRecordSchema = z.object({
  chief_complaint: z.string().optional(),
  history: z.string().max(5000, 'Texto muito longo').optional(),
  physical_exam: z.string().max(5000, 'Texto muito longo').optional(),
  diagnosis: z.string().max(1000, 'Diagnóstico muito longo').optional(),
  cid_10: z.string().length(7, 'CID-10 inválido (ex: A00.0)').optional(),
  treatment_plan: z.string().max(2000, 'Plano muito longo').optional(),
  notes: z.string().max(2000, 'Notas muito longas').optional(),
});

// ============================================================
// CREATE PRESCRIPTION SCHEMA
// ============================================================

const MedicationSchema = z.object({
  name: z.string().min(3, 'Nome do medicamento inválido'),
  dosage: z.string().min(1, 'Dosagem obrigatória'),
  frequency: z.string().min(1, 'Frequência obrigatória'),
  duration: z.string().min(1, 'Duração obrigatória'),
  instructions: z.string().optional(),
});

export const CreatePrescriptionSchema = z.object({
  consultation_id: z.string().uuid('ID de consulta inválido'),
  type: z.enum(['simple', 'special_white', 'special_yellow', 'blue', 'antimicrobial'], {
    errorMap: () => ({ message: 'Tipo de receita inválido' }),
  }),
  medications: z
    .array(MedicationSchema)
    .min(1, 'Prescrição deve ter no mínimo 1 medicamento')
    .max(20, 'Prescrição pode ter no máximo 20 medicamentos'),
});

// ============================================================
// TYPES
// ============================================================

export type CreateMedicalRecordInput = z.infer<typeof CreateMedicalRecordSchema>;
export type MedicationInput = z.infer<typeof MedicationSchema>;
export type CreatePrescriptionInput = z.infer<typeof CreatePrescriptionSchema>;
