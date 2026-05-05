import { z } from 'zod';

export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    label: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
    test: (pw) => pw.length >= MIN_PASSWORD_LENGTH,
  },
  {
    label: 'Al menos una letra mayúscula',
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    label: 'Al menos un número',
    test: (pw) => /\d/.test(pw),
  },
  {
    label: 'Al menos un carácter especial (!@#$%&*)',
    test: (pw) => /[!@#$%&*]/.test(pw),
  },
];

export const emailSchema = z
  .string({ required_error: 'El correo es obligatorio' })
  .min(1, 'El correo es obligatorio')
  .email('Ingresa un correo electrónico válido');

export const passwordSchema = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(MIN_PASSWORD_LENGTH, `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`)
  .regex(/[A-Z]/, 'Al menos una letra mayúscula')
  .regex(/\d/, 'Al menos un número')
  .regex(/[!@#$%&*]/, 'Al menos un carácter especial (!@#$%&*)');

export const codeSchema = z
  .string({ required_error: 'El código es obligatorio' })
  .length(6, 'El código debe tener 6 dígitos')
  .regex(/^\d+$/, 'Solo se permiten números');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre es muy corto'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Debes confirmar tu contraseña'),
  birthDate: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const passwordRequestSchema = z.object({
  email: emailSchema,
});

export const verifyCodeSchema = z.object({
  code: codeSchema,
});

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Debes confirmar tu contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const birthDateSchema = z
  .string()
  .min(1, 'La fecha de nacimiento es obligatoria')
  .refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Fecha inválida')
  .refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    return age >= 18 && age <= 120;
  }, 'Debes ser mayor de 18 años');

export function formatToDbDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidDbDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
}

export function parseDbDate(dateStr: string): Date | null {
  if (!isValidDbDate(dateStr)) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordRequestFormData = z.infer<typeof passwordRequestSchema>;
export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
