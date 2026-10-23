import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { NotificationEvent } from '../modules/notifications/notificationEvent.model.js';
import { PushToken } from '../modules/notifications/pushToken.model.js';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
  await Promise.all([NotificationEvent.init(), PushToken.init()]);
  logger.info('MongoDB connected');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
