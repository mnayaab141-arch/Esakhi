import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorType: { type: String, enum: ['user', 'system'], default: 'user', required: true },
    action: { type: String, required: true, maxlength: 120 },
    resourceType: { type: String, required: true, maxlength: 80 },
    resourceId: { type: String, required: true, maxlength: 120 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

export const AuditLog = model('AuditLog', auditLogSchema);
