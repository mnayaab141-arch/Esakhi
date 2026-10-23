import type { RequestHandler } from 'express';
import { AppError } from '../../utils/AppError.js';
import { authenticatedUserId } from '../../utils/authenticatedUser.js';
import { sendData, sendPage } from '../../utils/apiResponse.js';
import { NotificationEvent } from './notificationEvent.model.js';
import { PushToken } from './pushToken.model.js';
import { failedNotificationQuerySchema, notificationIdSchema, pushTokenSchema } from './notification.schemas.js';

export const registerPushToken: RequestHandler = async (req, res) => {
  const { token } = pushTokenSchema.parse(req.body);
  const userId = authenticatedUserId(req);
  await PushToken.findOneAndUpdate(
    { token },
    { $set: { userId, active: true, lastSeenAt: new Date() } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  sendData(res, { registered: true }, 201);
};

export const removePushToken: RequestHandler = async (req, res) => {
  const { token } = pushTokenSchema.parse(req.body);
  await PushToken.deleteOne({ token, userId: authenticatedUserId(req) });
  sendData(res, { removed: true });
};

export const listFailedNotifications: RequestHandler = async (req, res) => {
  const { page, limit } = failedNotificationQuerySchema.parse(req.query);
  const filter = { deliveryStatus: 'failed' as const };
  const [events, total] = await Promise.all([
    NotificationEvent.find(filter)
      .select('orderReference status attempts lastErrorCode createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    NotificationEvent.countDocuments(filter),
  ]);
  sendPage(res, events, page, limit, total);
};

export const retryFailedNotification: RequestHandler = async (req, res) => {
  const { id } = notificationIdSchema.parse(req.params);
  const failed = await NotificationEvent.findOne({ _id: id, deliveryStatus: 'failed' }).select('tokenId');
  if (!failed) throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Failed notification was not found.');
  const tokenActive = await PushToken.exists({ _id: failed.tokenId, active: true });
  if (!tokenActive) throw new AppError(409, 'PUSH_TOKEN_UNAVAILABLE', 'This device token is no longer active.');
  const event = await NotificationEvent.findOneAndUpdate(
    { _id: id, deliveryStatus: 'failed' },
    { $set: { deliveryStatus: 'pending', attempts: 0, nextAttemptAt: new Date() }, $unset: { lastErrorCode: 1 } },
    { new: true },
  ).select('_id deliveryStatus');
  if (!event) throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Failed notification was not found.');
  sendData(res, { id: event.id, deliveryStatus: event.deliveryStatus });
};
