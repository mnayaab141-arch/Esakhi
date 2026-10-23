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

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many verification attempts. Try again later.' },
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many session refresh requests. Try again later.' },
  },
});

export const authRoutes = Router();

authRoutes.post('/otp/request', otpLimiter, requestOtpController);
authRoutes.post('/otp/verify', otpLimiter, verifyOtpController);
authRoutes.post('/refresh', refreshLimiter, refreshController);
authRoutes.post('/logout', logoutController);
authRoutes.get('/me', requireAuth, meController);
authRoutes.patch('/me', requireAuth, updateProfileController);
authRoutes.put('/me/addresses', requireAuth, replaceSavedAddressesController);
