import { z } from 'zod'

// ---------------------------------------------------------------------------
// Login Form
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ---------------------------------------------------------------------------
// Signup Form (profile completion step)
// ---------------------------------------------------------------------------

export const signupProfileSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignupProfileFormData = z.infer<typeof signupProfileSchema>
