import { Schema, model } from 'mongoose';

const pushTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, maxlength: 4096 },
    active: { type: Boolean, default: true, required: true, index: true },
    lastSeenAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

export const PushToken = model('PushToken', pushTokenSchema);
