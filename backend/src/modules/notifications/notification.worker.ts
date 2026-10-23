import { logger } from '../../utils/logger.js';
import { NotificationEvent } from './notificationEvent.model.js';
import { PushToken } from './pushToken.model.js';
import { firebaseMessaging, isFirebaseAdminConfigured } from './firebaseAdmin.js';

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
const staleProcessingBefore = () => new Date(Date.now() - 5 * 60_000);

export async function processOrderNotificationQueue(): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;

  for (let index = 0; index < 50; index += 1) {
    const event = await NotificationEvent.findOneAndUpdate(
      {
        $or: [
          { deliveryStatus: 'pending', nextAttemptAt: { $lte: new Date() } },
          { deliveryStatus: 'processing', lockedAt: { $lte: staleProcessingBefore() } },
        ],
      },
      { $set: { deliveryStatus: 'processing', lockedAt: new Date() } },
      { new: true, sort: { nextAttemptAt: 1 } },
    );
    if (!event) return;

    const token = await PushToken.findOne({ _id: event.tokenId, userId: event.userId, active: true }).select('token');
    if (!token) {
      await NotificationEvent.updateOne({ _id: event._id, deliveryStatus: 'processing' }, {
        $set: { deliveryStatus: 'failed', lastErrorCode: 'PUSH_TOKEN_UNAVAILABLE' },
        $unset: { lockedAt: 1 },
      });
      continue;
    }

    try {
      const title = event.status === 'out_for_delivery'
        ? 'Your eSakhi order is out for delivery!'
        : event.status === 'delivered' || event.status === 'completed'
          ? 'Your eSakhi order is complete'
          : 'Your eSakhi order has an update';
      const body = event.status === 'out_for_delivery'
        ? `Order ${event.orderReference} is on its way. Tap to view your order.`
        : `Order ${event.orderReference} is now ${event.status.replaceAll('_', ' ')}.`;

      await firebaseMessaging().send({
        token: token.token,
        notification: { title, body },
        data: {
          orderId: event.orderId.toString(),
          orderStatus: event.status,
          url: `/orders/${event.orderId.toString()}`,
        },
        webpush: {
          fcmOptions: { link: `/orders/${event.orderId.toString()}` },
        },
      });
      await NotificationEvent.updateOne({ _id: event._id, deliveryStatus: 'processing' }, {
        $set: { deliveryStatus: 'sent', sentAt: new Date() },
        $inc: { attempts: 1 },
        $unset: { lockedAt: 1, lastErrorCode: 1 },
      });
    } catch (error) {
      const errorCode = getFirebaseErrorCode(error);
      const nextAttempts = event.attempts + 1;
      const invalidToken = ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(errorCode);
      if (invalidToken) {
        await PushToken.updateOne({ _id: token._id }, { $set: { active: false } });
      }
      const terminal = invalidToken || nextAttempts >= MAX_ATTEMPTS;
      await NotificationEvent.updateOne({ _id: event._id, deliveryStatus: 'processing' }, {
        $set: {
          deliveryStatus: terminal ? 'failed' : 'pending',
          lastErrorCode: errorCode,
          nextAttemptAt: new Date(Date.now() + (RETRY_DELAYS_MS[event.attempts] ?? RETRY_DELAYS_MS.at(-1)!)),
        },
        $inc: { attempts: 1 },
        $unset: { lockedAt: 1 },
      });
      logger.warn('Order push notification delivery failed', {
        eventId: event.id,
        errorCode,
        willRetry: !terminal,
      });
    }
  }
}

function getFirebaseErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code.slice(0, 100);
  }
  return 'FCM_DELIVERY_FAILED';
}
