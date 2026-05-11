import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name:       z.string().min(2, 'Name must be at least 2 characters.'),
  email:      z.string().email('Enter a valid email address.'),
  companyName: z.string().min(2, 'Company name is required.'),
  department: z.enum(['Integration', 'Support'], { message: 'Select a department.' }),
  password:   z.string().min(8, 'Password must be at least 8 characters.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
});

export const setPasswordSchema = z
  .object({
    password:        z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });