# eSakhi backend

Backend-only implementation for the eSakhi handmade-products marketplace. It uses Express 5, TypeScript, MongoDB/Mongoose, Zod validation, phone OTP authentication, and versioned REST APIs. No frontend has been generated.

## Requirements

- Node.js 24 Active LTS
- MongoDB Atlas or a local MongoDB **replica set**. Order placement, stock reservation, cancellation, and expiry cleanup use MongoDB transactions.
- npm

## Local setup

1. From `backend/`, run `npm ci`.
2. Copy `.env.example` to `.env`.
3. Generate two different JWT secrets:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"
   ```

   Set the output separately as `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. The example values are intentionally invalid placeholders; the server will refuse to start until they are replaced.
4. Configure `MONGODB_URI` for a replica-set MongoDB instance. For a local single-node replica set, start MongoDB with `--replSet rs0`, then run `rs.initiate()` once in `mongosh`.
5. Keep `OTP_PROVIDER=development` only in local development. `DEV_OTP_CODE` is the known local-only test code; it is not returned by the API or written to logs. Production refuses to start unless `OTP_PROVIDER=msg91`.
6. Start the API with `npm run dev`.
7. Provision the first admin from a trusted terminal:

   ```powershell
   npm run admin:create -- +91XXXXXXXXXX
   ```

   The command provisions that phone number as an admin and seeds the supplied launch area (Damoh, Madhya Pradesh, PIN 470661) as disabled until the business configures fulfilment. There is no public admin-registration or role-promotion endpoint.
8. Configure launch settings using the protected `PUT /api/v1/admin/settings` endpoint. Enable pickup/delivery and UPI/cash only after the business has confirmed the relevant instructions and fees. Select a stock reservation policy: `stockReservationHours: null` keeps stock reserved until staff/admin action; an integer from 1 to 720 enables automatic expiry of unconfirmed reservations.

## MSG91 production setup

Set `OTP_PROVIDER=msg91`, `MSG91_AUTH_KEY`, and `MSG91_OTP_TEMPLATE_ID` in the deployment secret store. Complete the MSG91 setup for Indian DLT entity registration, sender/header, and approved OTP template before enabling production OTP. Test send and verify with the live MSG91 account and approved template before launch; confirm the current API request/response contract, provider pricing, account requirements, and startup credits directly with MSG91. Those live-account and commercial checks are not verified by this code generation.

References provided for the integration:

- [MSG91 OTP API](https://docs.msg91.com/otp/sendotp)
- [MSG91 India DLT registration guide](https://msg91.com/help/dlt-registration-in-india/step-by-step-guide-to-implement-dlt-in-sms)

OTP codes are never included in API responses or application logs. The development provider is selected explicitly and is rejected in production.

## Commands

```powershell
npm run dev
npm run typecheck
npm test
npm run build
npm start
npm audit --audit-level=high
```

The API listens on `PORT` (default `5000`). `GET /health` is process liveness; `GET /ready` returns 503 until MongoDB is connected. Set `TRUST_PROXY_HOPS` to the exact trusted proxy hop count used by the deployment. Do not enable broad proxy trust.

## Security and deployment notes

- Access tokens last 15 minutes and are returned in the JSON response. The future frontend should keep them in memory and send them as `Authorization: Bearer ...`.
- Refresh tokens last seven days, are stored hashed in MongoDB, rotated on refresh, and sent only as an HttpOnly cookie with `SameSite=Strict` and `Secure` in production. Deploy frontend and API on the same site (for example sibling subdomains); unrelated cross-site domains will not send a Strict cookie.
- Configure `CLIENT_ORIGINS` with exact frontend origins. Do not use `*`.
- Configure MongoDB as a least-privilege application user and use HTTPS and deployment-managed secrets in production.
- Stock reservation and order creation are transactional; a standalone MongoDB server is not sufficient.
- Image uploads and payment-proof uploads are not implemented. Products accept HTTPS image URLs only; payment is reconciled manually by an authorized admin.
- A paid order cannot be cancelled through the current workflow until the business approves a refund policy. No gateway, refund, proof-upload, notification, Socket.IO, or analytics integrations are represented as active features.
- `express-mongo-sanitize` from the generic instruction sheet is not included. The backend validates requests with strict Zod schemas and builds MongoDB filters from validated fields rather than forwarding user-supplied query objects. If adding a sanitizer later, verify Express 5 compatibility and ensure it does not silently mutate accepted input.
- The in-memory rate-limit store is suitable for one process. Use a shared store before running multiple API instances.

## API reference

See [`docs/API.md`](./docs/API.md) for routes, request fields, roles, status transitions, response shape, and Postman setup.

## Backend review against the PRD and `instruction.md`

See [`docs/PRD-INSTRUCTION-REVIEW.md`](./docs/PRD-INSTRUCTION-REVIEW.md) for the best-practice assessment, deliberate deviations from the generic blueprint, and launch blockers that still require business/provider confirmation.
