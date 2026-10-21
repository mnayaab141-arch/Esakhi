# PRD and instruction-sheet review

## Verdict

The PRD is a sound product brief and is broadly aligned with the engineering practices in `instruction.md`: it calls for server-side validation and authorization, separate payment/fulfilment states, integer paise, stock protection, environment-managed secrets, bounded pagination, audit records, and explicit deployment/test readiness.

The generic instruction sheet is useful as a checklist, but it is not a domain specification and should not be copied mechanically. This backend follows the parts that fit the PRD and records the intentional exceptions below.

## Implemented best practices

| Practice | Implementation |
|---|---|
| TypeScript strict mode | `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are enabled. |
| Current runtime/framework and dependency review | Node.js 24 LTS and current npm registry package versions were checked before installation; Express 5 and Mongoose 9 are used. |
| Runtime configuration validation | Zod rejects missing/invalid configuration at startup. JWT secrets must be distinct, 128-character hex values generated from 64 random bytes. |
| REST versioning and response shape | API routes use `/api/v1`; success/error envelopes are consistent and errors do not return stack traces. |
| Authentication | PRD-confirmed Indian phone OTP; short-lived HS256 access JWT; seven-day refresh JWT in an HttpOnly cookie; refresh tokens are bcrypt-hashed and rotated. |
| OTP protection | OTP request/verify endpoints are rate limited; each phone has a one-minute send cooldown; challenges expire after five minutes and are single-use with bounded verification attempts. |
| Authorization and ownership | Admin/staff APIs check roles on the server; customer order lookups include the authenticated customer ID. Staff routes remain disabled until an admin enables `staffEnabled`. |
| Input validation | Zod validates route bodies, query values, and identifiers; product/settings/order schemas reject unknown body fields. Database filters are explicitly built from parsed input. |
| Stock/order integrity | Stock uses conditional updates inside MongoDB transactions; price and totals are computed server-side; idempotency keys prevent duplicate orders; order/address/item price snapshots are stored. |
| Manual payments | UPI/cash configuration is explicit; payment status is separate from fulfilment; only an admin can confirm/reject payment; payment actions are audited. |
| Audit/privacy | Administrative product, inventory, payment, cancellation, role, and settings operations are audited; customer order responses omit internal notes and admin payment-review notes. |
| Operational baseline | `/health`, `/ready`, graceful shutdown, structured Winston logs, request-size limit, Helmet, exact-origin CORS, and global/auth rate limits are included. |
| Supply-chain baseline | Dependency lockfile is committed; `npm audit --audit-level=high` reported zero vulnerabilities after install. |

## Deliberate adaptations to the generic instructions

- **Phone OTP replaces email/password and Google OAuth.** This follows the selected PRD/business decision. MSG91 is the production adapter; local development uses an explicit test adapter. No public endpoint can create/promote an admin.
- **No Socket.IO, cron, SMTP, Sentry, encryption helper, or file-upload package was added.** They are not required for the confirmed launch flows. Reservation expiry uses a small bounded worker in the API process. Add durable shared scheduling/monitoring if deployment scale or operational requirements warrant it.
- **No `express-mongo-sanitize` middleware.** This service strictly parses input and constructs MongoDB queries from typed, allowlisted fields. Do not pass raw request objects into Mongoose. If a sanitizer is added later, verify Express 5 compatibility and avoid silently rewriting accepted input.
- **Cookie deployment constraint:** `SameSite=Strict` follows the instruction sheet. The frontend and API must share a site; a separate unrelated frontend domain would require a different cookie/CSRF design.
- **Transactional MongoDB requirement:** use Atlas or a replica set locally. A standalone MongoDB server cannot safely support atomic multi-document order and stock operations.
- **Security secret length:** the instruction sheet has conflicting examples (32/64 characters versus 64 random bytes). This backend consistently requires two distinct 64-byte secrets represented as 128 hex characters.

## PRD launch decisions represented as configuration

- Initial service area seeded by admin provisioning: Damoh, Madhya Pradesh, PIN 470661. Delivery and pickup remain disabled until configured.
- UPI, cash instructions, UPI ID/QR URL, locality delivery fees, contact details, policies, and staff access are stored as admin settings. No payment/contact/fee values are invented.
- Stock reservation is configurable: `null` means hold until an admin action; 1–720 hours enables automatic release for unpaid/unconfirmed orders.
- Customers may request cancellation; admins decide. Orders already marked paid cannot be cancelled until a refund policy is approved.
- Product images are HTTPS URLs only; no upload provider has been chosen. Payment proof upload is not enabled.

## Remaining launch gates

1. Verify MSG91's current API request/response contract using the actual account, approved OTP template, and Indian DLT registration. The public documentation page was reachable but did not expose its API schema in this environment; no paid send/verify or provider pricing/account-credit checks were possible here. Treat production OTP as blocked until a real MSG91 test passes.
2. Configure the real locality list, delivery fees, available fulfilment methods, UPI/cash instructions, business contacts, and policy wording.
3. Approve cancellation/refund rules and the stock reservation duration.
4. Verify backups/restoration and choose a shared rate-limit store before horizontal scaling.
5. Run order/concurrency integration tests against the target replica-set MongoDB before launch; the included automated tests cover API health, validation, and authorization routing without needing live infrastructure.
