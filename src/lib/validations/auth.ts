import { z } from 'zod';
import { UserRole } from '@/types/database.types';

/**
 * CPF validation (simplified)
 */
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i), 10) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i), 10) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11), 10)) return false;

  return true;
};

// ============================================================
// SIGNUP SCHEMAS
// ============================================================

export const SignupPatientSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    password_confirm: z.string(),
    full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
    cpf: z.string().refine(validateCPF, 'CPF inválido'),
    birth_date: z.string().datetime().optional(),
    phone: z.string().regex(/^\+?\d{10,}$/, 'Telefone inválido').optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Senhas não conferem',
    path: ['password_confirm'],
  });

export const SignupDoctorSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    password_confirm: z.string(),
    full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
    cpf: z.string().refine(validateCPF, 'CPF inválido'),
    birth_date: z.string().datetime().optional(),
    phone: z.string().regex(/^\+?\d{10,}$/, 'Telefone inválido'),
    crm: z.string().min(5, 'CRM inválido'),
    crm_state: z.string().length(2, 'UF inválido (ex: SP, RJ)'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Senhas não conferem',
    path: ['password_confirm'],
  });

export const SignupSchema = z.union([SignupPatientSchema, SignupDoctorSchema]);

// ============================================================
// LOGIN SCHEMA
// ============================================================

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha inválida'),
});

// ============================================================
// TYPES
// ============================================================

export type SignupPatientInput = z.infer<typeof SignupPatientSchema>;
export type SignupDoctorInput = z.infer<typeof SignupDoctorSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
