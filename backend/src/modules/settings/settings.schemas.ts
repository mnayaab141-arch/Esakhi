import { z } from 'zod';

const policyKeySchema = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,79}$/, 'Use letters, numbers, underscores, or hyphens for policy keys.');

const localitySchema = z.object({
  name: z.string().trim().min(1).max(100),
  postalCodes: z.array(z.string().regex(/^\d{6}$/)).min(1).max(100),
  deliveryFeePaise: z.number().int().min(0).max(100_000_000).optional(),
}).strict();

export const settingsUpdateSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  serviceableLocalities: z.array(localitySchema).max(100),
  pickupEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  staffEnabled: z.boolean(),
  upiEnabled: z.boolean(),
  upiId: z.string().trim().max(100).optional(),
  upiQrUrl: z.string().url().refine(isHttpsUrl, 'UPI QR image must use HTTPS.')
    .or(z.literal('')).optional(),
  upiInstructions: z.string().trim().max(1000).optional(),
  cashEnabled: z.boolean(),
  cashInstructions: z.string().trim().max(1000).optional(),
  pickupInstructions: z.string().trim().max(1000).optional(),
  stockReservationHours: z.number().int().min(1).max(720).nullable(),
  policies: z.record(policyKeySchema, z.string().max(5000)).default({}),
  lowStockThreshold: z.number().int().min(0).max(100_000),
}).strict().superRefine((settings, context) => {
  if (settings.deliveryEnabled && settings.serviceableLocalities.some((locality) => locality.deliveryFeePaise === undefined)) {
    context.addIssue({ code: 'custom', path: ['serviceableLocalities'], message: 'Each delivery locality needs a configured delivery fee.' });
  }
  if (settings.deliveryEnabled && settings.serviceableLocalities.length === 0) {
    context.addIssue({ code: 'custom', path: ['serviceableLocalities'], message: 'Configure at least one serviceable locality.' });
  }
  if (settings.upiEnabled && (!settings.upiId || !settings.upiInstructions)) {
    context.addIssue({ code: 'custom', path: ['upiId'], message: 'UPI ID and customer instructions are required when UPI is enabled.' });
  }
  if (settings.cashEnabled && !settings.cashInstructions) {
    context.addIssue({ code: 'custom', path: ['cashInstructions'], message: 'Cash payment instructions are required when cash is enabled.' });
  }
  const postalCodes = settings.serviceableLocalities.flatMap((locality) => locality.postalCodes);
  if (new Set(postalCodes).size !== postalCodes.length) {
    context.addIssue({ code: 'custom', path: ['serviceableLocalities'], message: 'A postal code can belong to only one locality.' });
  }
});

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
