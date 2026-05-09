import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  username: z
    .string()
    .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
    .max(30, 'Nome de usuário deve ter no máximo 30 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e underscore'),
  full_name: z.string().min(2, 'Nome completo deve ter no mínimo 2 caracteres'),
  phone: z
    .string()
    .regex(
      /^(\+?55\s?)?(\(?\d{2}\)?[\s\-]?)(\d{4,5}[\s\-]?\d{4})$/,
      'Telefone inválido. Ex: (11) 98765-4321'
    ),
  city: z.string().optional(),
  state: z.string().max(2).optional().or(z.literal('')),
  contact_by_whatsapp: z.boolean(),
  contact_by_email: z.boolean(),
  lgpd_consent: z
    .boolean()
    .refine((val) => val === true, 'Você deve aceitar os termos para continuar'),
})

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export const contactSchema = z.object({
  owner_id: z.string().uuid(),
  sticker_id: z.string().uuid(),
  message: z.string().max(300, 'Mensagem deve ter no máximo 300 caracteres').optional(),
  method: z.enum(['whatsapp', 'email']),
})

export type RegisterFormData = z.infer<typeof registerSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type ContactFormData = z.infer<typeof contactSchema>
