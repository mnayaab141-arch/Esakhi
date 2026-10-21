import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import { authenticatedUserId } from '../../utils/authenticatedUser.js';
import { sendData } from '../../utils/apiResponse.js';
import { AuditLog } from '../audit/auditLog.model.js';
import { Product } from '../catalog/product.model.js';
import { InventoryAdjustment } from './inventoryAdjustment.model.js';
import { adjustmentSchema, inventoryProductParamsSchema } from './inventory.schemas.js';

export const adjustInventory: RequestHandler = async (req, res) => {
  const { productId } = inventoryProductParamsSchema.parse(req.params);
  const { quantityChange, reason, variantId } = adjustmentSchema.parse(req.body);
  const actorId = authenticatedUserId(req);
  const session = await mongoose.startSession();
  let updatedProduct: unknown;
  try {
    await session.withTransaction(async () => {
      const filter = variantId
        ? { _id: productId, variants: { $elemMatch: { _id: variantId, stock: { $gte: Math.max(0, -quantityChange) } } } }
        : { _id: productId, stock: { $gte: Math.max(0, -quantityChange) } };
      const update = variantId
        ? { $inc: { 'variants.$.stock': quantityChange } }
        : { $inc: { stock: quantityChange } };
      const product = await Product.findOneAndUpdate(filter, update, { new: true, session });
      if (!product) {
        throw new AppError(409, 'INVENTORY_UPDATE_FAILED', 'Product or variant was not found, or stock cannot become negative.');
      }
      await InventoryAdjustment.create([{
        productId,
        ...(variantId ? { variantId } : {}),
        quantityChange,
        reason,
        actorId,
      }], { session });
      await AuditLog.create([{
        actorId,
        action: 'inventory.adjusted',
        resourceType: 'product',
        resourceId: productId,
        metadata: { quantityChange, variantId: variantId ?? null, reason },
      }], { session });
      updatedProduct = product;
    });
  } finally {
    await session.endSession();
  }
  sendData(res, updatedProduct);
};
