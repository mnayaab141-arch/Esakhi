import type { Request } from 'express';
import { AppError } from './AppError.js';

export function authenticatedUserId(req: Request): string {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }
  return req.user.id;
}
