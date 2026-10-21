import { z } from 'zod';

export const adjustmentSchema = z.object({
  quantityChange: z.number().int().min(-100_000).max(100_000).refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(300),
  variantId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).strict();

export const inventoryProductParamsSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
});
