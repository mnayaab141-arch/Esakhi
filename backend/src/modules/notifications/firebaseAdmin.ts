import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { z } from 'zod';
import { env } from '../../config/env.js';

const serviceAccountSchema = z.object({
  project_id: z.string().min(1),
  client_email: z.string().email(),
  private_key: z.string().min(1),
});

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

export function firebaseMessaging() {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('Firebase Admin is not configured.');
  }
  let credentials: unknown;
  try {
    credentials = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.');
  }
  const serviceAccount = serviceAccountSchema.parse(credentials);
  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
    projectId: serviceAccount.project_id,
  });
  return getMessaging(app);
}
