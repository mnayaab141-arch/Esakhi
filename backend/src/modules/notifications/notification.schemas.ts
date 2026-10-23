import { z } from 'zod';

export const pushTokenSchema = z.object({
  token: z.string().trim().min(20).max(4096),
}).strict();

export const notificationIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export const failedNotificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
