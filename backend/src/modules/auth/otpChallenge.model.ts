import { Schema, model } from 'mongoose';

const otpChallengeSchema = new Schema(
  {
    phoneE164: { type: String, required: true },
    providerRequestId: { type: String },
    expiresAt: { type: Date, required: true, expires: 0 },
    attempts: { type: Number, default: 0, required: true },
    verificationStartedAt: { type: Date },
    lastRequestedAt: { type: Date, required: true },
  },
  { timestamps: true },
);
otpChallengeSchema.index({ phoneE164: 1 }, { unique: true });

export const OtpChallenge = model('OtpChallenge', otpChallengeSchema);
