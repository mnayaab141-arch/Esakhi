import { z } from 'zod';

const normalizedPhoneSchema = z.string().trim().transform((value) => {
  const compact = value.replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;
  if (/^\+91[6-9]\d{9}$/.test(compact)) return compact;
  return compact;
}).pipe(z.string().regex(/^\+91[6-9]\d{9}$/, 'Enter a valid Indian mobile number.'));

export const requestOtpSchema = z.object({
  phone: normalizedPhoneSchema,
}).strict();

export const verifyOtpSchema = z.object({
  phone: normalizedPhoneSchema,
  code: z.string().regex(/^\d{6}$/, 'OTP must contain six digits.'),
}).strict();

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
}).strict();

export const savedAddressSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  label: z.string().trim().max(40).optional(),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^\+91[6-9]\d{9}$/),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  locality: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().regex(/^\d{6}$/),
}).strict();

export const replaceSavedAddressesSchema = z.object({
  addresses: z.array(savedAddressSchema).max(10),
}).strict();

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
