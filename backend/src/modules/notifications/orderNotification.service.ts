import { randomUUID } from 'node:crypto';
import type { ClientSession, HydratedDocument } from 'mongoose';
import type { OrderRecord } from '../orders/order.model.js';
import { NotificationEvent } from './notificationEvent.model.js';
import { PushToken } from './pushToken.model.js';

export async function enqueueOrderStatusNotification(
  order: HydratedDocument<OrderRecord>,
  status: string,
  session: ClientSession,
): Promise<void> {
  const tokens = await PushToken.find({ userId: order.customerId, active: true }).select('_id').session(session).lean();
  if (tokens.length === 0) return;

  const eventKey = randomUUID();
  await NotificationEvent.insertMany(tokens.map(({ _id: tokenId }) => ({
    eventKey,
    tokenId,
    userId: order.customerId,
    orderId: order._id,
    orderReference: order.orderReference,
    status,
  })), { session });
}
