import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  logoutController,
  meController,
  refreshController,
  requestOtpController,
  replaceSavedAddressesController,
  updateProfileController,
  verifyOtpController,
} from './auth.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Try again later.' },
  },
});

export const authRoutes = Router();

authRoutes.post('/otp/request', authLimiter, requestOtpController);
authRoutes.post('/otp/verify', authLimiter, verifyOtpController);
authRoutes.post('/refresh', authLimiter, refreshController);
authRoutes.post('/logout', logoutController);
authRoutes.get('/me', requireAuth, meController);
authRoutes.patch('/me', requireAuth, updateProfileController);
authRoutes.put('/me/addresses', requireAuth, replaceSavedAddressesController);
