import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Valid email required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter required')
    .regex(/[a-z]/, 'At least one lowercase letter required')
    .regex(/[0-9]/, 'At least one digit required')
    .regex(/[^A-Za-z0-9]/, 'At least one special character required'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
