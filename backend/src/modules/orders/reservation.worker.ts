import mongoose from 'mongoose';
import { logger } from '../../utils/logger.js';
import { AuditLog } from '../audit/auditLog.model.js';
import { Product } from '../catalog/product.model.js';
import { InventoryAdjustment } from '../inventory/inventoryAdjustment.model.js';
import { Order } from './order.model.js';
import { enqueueOrderStatusNotification } from '../notifications/orderNotification.service.js';

export async function releaseExpiredReservations(): Promise<void> {
  const now = new Date();
  const candidates = await Order.find({
    reservationExpiresAt: { $lte: now },
    fulfilmentStatus: { $in: ['placed', 'accepted'] },
    paymentStatus: { $ne: 'confirmed' },
  }).select('_id').sort({ reservationExpiresAt: 1 }).limit(100).lean();

  for (const candidate of candidates) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Order.findOne({
          _id: candidate._id,
          reservationExpiresAt: { $lte: now },
          fulfilmentStatus: { $in: ['placed', 'accepted'] },
          paymentStatus: { $ne: 'confirmed' },
        }).session(session);
        if (!order) return;

        for (const item of order.items) {
          const filter = item.variantId
            ? { _id: item.productId, 'variants._id': item.variantId }
            : { _id: item.productId };
          const update = item.variantId
            ? { $inc: { 'variants.$.stock': item.quantity } }
            : { $inc: { stock: item.quantity } };
          const restored = await Product.updateOne(filter, update, { session });
          if (restored.modifiedCount !== 1) {
            throw new Error(`Unable to restore expired reservation for order ${order.id}.`);
          }
          await InventoryAdjustment.create([{
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            quantityChange: item.quantity,
            reason: 'Expired stock reservation',
            actorType: 'system',
            orderId: order._id,
          }], { session });
        }

        order.fulfilmentStatus = 'cancelled';
        order.cancellationReason = 'Stock reservation expired.';
        order.statusHistory.push({
          status: 'cancelled',
          changedAt: now,
          actorType: 'system',
          note: 'Stock reservation expired.',
        });
        await order.save({ session });
        await enqueueOrderStatusNotification(order, 'cancelled', session);
        await AuditLog.create([{
          actorType: 'system',
          action: 'order.reservation_expired',
          resourceType: 'order',
          resourceId: order.id,
          metadata: { orderReference: order.orderReference },
        }], { session });
      });
    } catch (error) {
      logger.error('Failed to release an expired stock reservation', {
        orderId: candidate._id.toString(),
        name: error instanceof Error ? error.name : 'Unknown error',
      });
    } finally {
      await session.endSession();
    }
  }
}
