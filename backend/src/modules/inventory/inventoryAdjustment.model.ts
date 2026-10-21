import { Schema, model } from 'mongoose';

const inventoryAdjustmentSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantId: { type: Schema.Types.ObjectId },
    quantityChange: { type: Number, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorType: { type: String, enum: ['user', 'system'], default: 'user', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const InventoryAdjustment = model('InventoryAdjustment', inventoryAdjustmentSchema);
