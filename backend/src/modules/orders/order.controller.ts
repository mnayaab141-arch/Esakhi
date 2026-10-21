import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { authenticatedUserId } from '../../utils/authenticatedUser.js';
import { sendData, sendPage } from '../../utils/apiResponse.js';
import { AuditLog } from '../audit/auditLog.model.js';
import { InventoryAdjustment } from '../inventory/inventoryAdjustment.model.js';
import { Product } from '../catalog/product.model.js';
import { Settings } from '../settings/settings.model.js';
import { Order } from './order.model.js';
import {
  cancellationRequestSchema,
  cancellationReviewSchema,
  createOrderSchema,
  fulfilmentUpdateSchema,
  internalNoteSchema,
  orderIdParamsSchema,
  orderListQuerySchema,
  orderPaginationQuerySchema,
  paymentReviewSchema,
} from './order.schemas.js';
import { createOrder } from './order.service.js';

export const createOrderController: RequestHandler = async (req, res) => {
  const input = createOrderSchema.parse(req.body);
  const { order, created } = await createOrder(authenticatedUserId(req), input);
  const settings = await Settings.findOne({ key: 'global' })
    .select('upiId upiQrUrl upiInstructions cashInstructions').lean();
  const paymentInstructions = input.paymentMethod === 'upi'
    ? { method: 'upi', upiId: settings?.upiId, qrImageUrl: settings?.upiQrUrl, instructions: settings?.upiInstructions }
    : { method: 'cash', instructions: settings?.cashInstructions };
  sendData(res, { order: toCustomerOrder(order.toObject()), paymentInstructions }, created ? 201 : 200);
};

export const listMyOrders: RequestHandler = async (req, res) => {
  const query = orderPaginationQuerySchema.parse(req.query);
  const customerId = authenticatedUserId(req);
  const [orders, total] = await Promise.all([
    Order.find({ customerId }).select('-internalNotes -paymentEvents -idempotencyKey -cancellationRequest.reviewedBy -cancellationRequest.adminNote').sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    Order.countDocuments({ customerId }),
  ]);
  sendPage(res, orders, query.page, query.limit, total);
};

export const getMyOrder: RequestHandler = async (req, res) => {
  const { id } = orderIdParamsSchema.parse(req.params);
  const order = await Order.findOne({ _id: id, customerId: authenticatedUserId(req) })
    .select('-internalNotes -paymentEvents -idempotencyKey -cancellationRequest.reviewedBy -cancellationRequest.adminNote').lean();
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found.');
  sendData(res, toCustomerOrder(order));
};

export const requestOrderCancellation: RequestHandler = async (req, res) => {
  const { id } = orderIdParamsSchema.parse(req.params);
  const input = cancellationRequestSchema.parse(req.body);
  const order = await Order.findOneAndUpdate(
    {
      _id: id,
      customerId: authenticatedUserId(req),
      fulfilmentStatus: { $in: ['placed', 'accepted'] },
      'cancellationRequest.requestedAt': { $exists: false },
    },
    {
      $set: {
        'cancellationRequest.requestedAt': new Date(),
        ...(input.note ? { 'cancellationRequest.customerNote': input.note } : {}),
      },
    },
    { new: true },
  );
  if (!order) throw new AppError(409, 'CANCELLATION_NOT_ALLOWED', 'This order cannot be cancelled or already has a cancellation request.');
  await AuditLog.create({
    actorId: authenticatedUserId(req),
    action: 'order.cancellation_requested',
    resourceType: 'order',
    resourceId: order.id,
    metadata: { orderReference: order.orderReference },
  });
  sendData(res, toCustomerOrder(order.toObject()));
};

export const listAdminOrders: RequestHandler = async (req, res) => {
  const query = orderListQuerySchema.parse(req.query);
  const filter = {
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.fulfilmentStatus ? { fulfilmentStatus: query.fulfilmentStatus } : {}),
    ...(query.from || query.to ? {
      createdAt: {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      },
    } : {}),
    ...(query.q ? {
      $or: [
        { orderReference: { $regex: escapeRegex(query.q), $options: 'i' } },
        { customerName: { $regex: escapeRegex(query.q), $options: 'i' } },
        { customerPhoneE164: { $regex: escapeRegex(query.q), $options: 'i' } },
      ],
    } : {}),
  };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    Order.countDocuments(filter),
  ]);
  sendPage(res, orders, query.page, query.limit, total);
};

export const getAdminOrder: RequestHandler = async (req, res) => {
  const { id } = orderIdParamsSchema.parse(req.params);
  const order = await Order.findById(id).lean();
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found.');
  sendData(res, order);
};

export const updateFulfilmentStatus: RequestHandler = async (req, res) => {
  const { id } = orderIdParamsSchema.parse(req.params);
  const { status } = fulfilmentUpdateSchema.parse(req.body);
  const order = await Order.findById(id);
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found.');

  const nextStates: Record<string, string[]> = {
    placed: ['accepted'],
    accepted: ['preparing'],
    preparing: [order.fulfilmentMethod === 'pickup' ? 'ready_for_pickup' : 'out_for_delivery'],
    ready_for_pickup: ['completed'],
    out_for_delivery: ['completed'],
  };
  if (!nextStates[order.fulfilmentStatus]?.includes(status)) {
    throw new AppError(409, 'INVALID_STATUS_TRANSITION', 'That fulfilment status transition is not allowed.');
  }
  const priorStatus = order.fulfilmentStatus;
  const actorId = authenticatedUserId(req);
  const session = await mongoose.startSession();
  let updatedOrder;
  try {
    updatedOrder = await session.withTransaction(async () => {
      const updated = await Order.findOneAndUpdate(
        { _id: id, fulfilmentStatus: priorStatus },
        { $set: { fulfilmentStatus: status } },
        { new: true, session },
      );
      if (!updated) throw new AppError(409, 'INVALID_STATUS_TRANSITION', 'The order status changed; reload and try again.');
      await AuditLog.create([{
        actorId,
        action: 'order.fulfilment_updated',
        resourceType: 'order',
        resourceId: updated.id,
        metadata: { status },
      }], { session });
      return updated;
    });
  } finally {
    await session.endSession();
  }
  if (!updatedOrder) throw new AppError(500, 'INTERNAL_ERROR', 'The fulfilment status could not be updated.');
  sendData(res, updatedOrder);
};

export const reviewPayment: RequestHandler = async (req, res) => {
  const { id } = orderIdParamsSchema.parse(req.params);
  const input = paymentReviewSchema.parse(req.body);
  const actorId = authenticatedUserId(req);
  const session = await mongoose.startSession();
  let order;
  try {
    order = await session.withTransaction(async () => {
      const reviewed = await Order.findOneAndUpdate(
        { _id: id, paymentStatus: 'pending_verification', fulfilmentStatus: { $ne: 'cancelled' } },
        {
          $set: { paymentStatus: input.status },
          $push: { paymentEvents: { status: input.status, actorId, note: input.note, createdAt: new Date() } },
        },
        { new: true, runValidators: true, session },
      );
      if (!reviewed) throw new AppError(409, 'PAYMENT_ALREADY_REVIEWED', 'Payment is not awaiting verification.');
      await AuditLog.create([{
        actorId,
        action: 'order.payment_reviewed',
        resourceType: 'order',
        resourceId: reviewed.id,
        metadata: { status: input.status },
      }], { session });
      return reviewed;
    });
  } finally {
    await session.endSession();
  }
  if (!order) throw new AppError(500, 'INTERNAL_ERROR', 'The payment review could not be saved.');
  sendData(res, order);
};

export const reviewCancellation: RequestHandler = async (req, res) => {
  const { id } = orderIdParamsSchema.parse(req.params);
  const input = cancellationReviewSchema.parse(req.body);
  const actorId = authenticatedUserId(req);
  const session = await mongoose.startSession();
  let result: unknown;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: id,
        'cancellationRequest.requestedAt': { $exists: true },
        'cancellationRequest.decision': { $exists: false },
      }).session(session);
      if (!order) throw new AppError(409, 'CANCELLATION_ALREADY_REVIEWED', 'There is no pending cancellation request.');
      if (input.decision === 'approved') {
        if (!['placed', 'accepted'].includes(order.fulfilmentStatus)) {
          throw new AppError(409, 'CANCELLATION_NOT_ALLOWED', 'The order can no longer be cancelled.');
        }
        if (order.paymentStatus === 'confirmed') {
          throw new AppError(409, 'REFUND_POLICY_UNCONFIGURED', 'A confirmed payment cannot be cancelled until a refund policy is configured.');
        }
        for (const item of order.items) {
          const filter = item.variantId
            ? { _id: item.productId, 'variants._id': item.variantId }
            : { _id: item.productId };
          const update = item.variantId
            ? { $inc: { 'variants.$.stock': item.quantity } }
            : { $inc: { stock: item.quantity } };
          const restored = await Product.updateOne(filter, update, { session });
          if (restored.modifiedCount !== 1) {
            throw new AppError(409, 'INVENTORY_RESTORE_FAILED', 'Inventory could not be restored; contact support.');
          }
          await InventoryAdjustment.create([{
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            quantityChange: item.quantity,
            reason: 'Approved order cancellation',
            actorId,
            orderId: order._id,
          }], { session });
        }
        order.fulfilmentStatus = 'cancelled';
      }
      const cancellationRequest = order.cancellationRequest;
      if (!cancellationRequest) {
        throw new AppError(409, 'CANCELLATION_NOT_FOUND', 'There is no pending cancellation request.');
      }
      cancellationRequest.reviewedAt = new Date();
      cancellationRequest.reviewedBy = new mongoose.Types.ObjectId(actorId);
      cancellationRequest.decision = input.decision;
      cancellationRequest.adminNote = input.note ?? null;
      await order.save({ session });
      await AuditLog.create([{
        actorId,
        action: `order.cancellation_${input.decision}`,
        resourceType: 'order',
        resourceId: order.id,
        metadata: { orderReference: order.orderReference },
      }], { session });
      result = order;
    });
  } finally {
    await session.endSession();
  }
  sendData(res, result);
};

export const addInternalNote: RequestHandler = async (req, res) => {
  const { id } = orderIdParamsSchema.parse(req.params);
  const { note } = internalNoteSchema.parse(req.body);
  const order = await Order.findByIdAndUpdate(id, { $push: { internalNotes: note } }, { new: true });
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found.');
  await AuditLog.create({
    actorId: authenticatedUserId(req),
    action: 'order.note_added',
    resourceType: 'order',
    resourceId: order.id,
  });
  sendData(res, order);
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toCustomerOrder(order: object): Record<string, unknown> {
  const customerOrder = { ...order } as Record<string, unknown>;
  delete customerOrder.internalNotes;
  delete customerOrder.paymentEvents;
  delete customerOrder.idempotencyKey;
  if (typeof customerOrder.cancellationRequest === 'object' && customerOrder.cancellationRequest !== null) {
    const cancellation = { ...customerOrder.cancellationRequest } as Record<string, unknown>;
    delete cancellation.reviewedBy;
    delete cancellation.adminNote;
    customerOrder.cancellationRequest = cancellation;
  }
  return customerOrder;
}
