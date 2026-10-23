import { Schema, model } from 'mongoose';

const notificationEventSchema = new Schema(
  {
    eventKey: { type: String, required: true },
    tokenId: { type: Schema.Types.ObjectId, ref: 'PushToken', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderReference: { type: String, required: true },
    status: { type: String, required: true },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed'],
      default: 'pending',
      required: true,
      index: true,
    },
    attempts: { type: Number, default: 0, required: true },
    nextAttemptAt: { type: Date, default: Date.now, required: true, index: true },
    lockedAt: { type: Date },
    lastErrorCode: { type: String, maxlength: 100 },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

notificationEventSchema.index({ eventKey: 1, tokenId: 1 }, { unique: true });

export const NotificationEvent = model('NotificationEvent', notificationEventSchema);
