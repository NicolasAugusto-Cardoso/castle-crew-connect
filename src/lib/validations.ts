import { z } from 'zod';

// Validação de e-mail com regras LGPD/GDPR
export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "E-mail é obrigatório" })
  .max(255, { message: "E-mail deve ter no máximo 255 caracteres" })
  .email({ message: "E-mail inválido" })
  .transform(email => email.toLowerCase());

// Validação de telefone (formato brasileiro)
export const phoneSchema = z
  .string()
  .trim()
  .min(1, { message: "Telefone é obrigatório" })
  .regex(/^\+?[\d\s\-()]+$/, { message: "Formato de telefone inválido" })
  .transform(phone => phone.replace(/\D/g, '')) // Remove caracteres não numéricos
  .refine(phone => phone.length >= 10, { message: "Telefone deve ter no mínimo 10 dígitos" })
  .refine(phone => phone.length <= 20, { message: "Telefone deve ter no máximo 20 dígitos" });

// Validação de nome (sem números ou caracteres especiais)
export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Nome é obrigatório" })
  .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: "Nome não pode conter números ou caracteres especiais" });

// Validação de mensagem/texto
export const messageSchema = z
  .string()
  .trim()
  .min(1, { message: "Mensagem é obrigatória" })
  .max(2000, { message: "Mensagem deve ter no máximo 2000 caracteres" });

// Validação de senha forte
export const passwordSchema = z
  .string()
  .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  .max(72, { message: "Senha deve ter no máximo 72 caracteres" })
  .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
  .regex(/[a-z]/, { message: "Senha deve conter pelo menos uma letra minúscula" })
  .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" })
  .regex(/[^A-Za-z0-9]/, { message: "Senha deve conter pelo menos um caractere especial" });

// Schema de contato
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema,
  message: messageSchema
});

// Schema de login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Senha é obrigatória" })
});

// Schema de cadastro
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

// Schema de discipulado
export const discipleshipContactSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema.optional(),
  age: z.number().int().min(1).max(150).optional(),
  neighborhood: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional()
});

// Schema de testemunho
export const testimonialSchema = z.object({
  title: z.string().trim().min(1, { message: "Título é obrigatório" }).max(200),
  content: messageSchema,
  author_name: nameSchema
});

// Schema de post
export const postSchema = z.object({
  title: z.string().trim().min(1, { message: "Título é obrigatório" }).max(200),
  content: messageSchema,
  image_url: z.string().url().optional()
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type DiscipleshipContactData = z.infer<typeof discipleshipContactSchema>;
export type TestimonialData = z.infer<typeof testimonialSchema>;
export type PostData = z.infer<typeof postSchema>;
