# eSakhi — Product Requirements Document (PRD)

**Document status:** Draft for review  
**Product:** eSakhi — Local marketplace for handmade products  
**Version:** 1.0  
**Date:** 20 October 2026

> **Source note:** This PRD uses the eSakhi requirements shared in the conversation. The linked Google Doc could not be retrieved in this session, so its contents have not been independently reviewed. Please compare this draft with the document and share any missing requirements before treating this as final.

---

## 1. Product Overview

eSakhi is a full-featured e-commerce platform for handmade products offered by a women’s self-help group in India. It will help customers discover and purchase ready-made products, while giving the group an administrative workspace to manage products, inventory, orders, customers, and local fulfilment.

The platform is intended to be a complete product, not an MVP. Features should be designed as a coherent system, with a maintainable architecture that can be expanded as the business grows.

### 1.1 Product vision

Make locally made, handmade products easy to discover and buy, while helping the women’s self-help group manage sales and fulfilment digitally.

### 1.2 Business goals

- Present the group and its products through a trustworthy, polished online storefront.
- Make it easy for customers in the supported local service area to browse products and place orders.
- Keep product availability and stock quantities accurate.
- Support manual order and payment confirmation initially.
- Give administrators clear control over products, inventory, orders, and fulfilment.
- Provide a foundation that can support additional locations and payment integrations later, without promising those capabilities in the initial release.

### 1.3 Target users

1. **Customers:** People within the serviceable local city who want to buy handmade products.
2. **Administrators:** Authorized members of the self-help group who maintain the catalogue and manage orders.
3. **Order-fulfilment staff:** Authorized users who prepare, pack, and hand over or deliver orders, where this role is needed.

---

## 2. Scope and Product Principles

### 2.1 Full-product scope

This is not an MVP specification. The product should include the complete customer shopping journey, operational administration, inventory and order management, security, responsive design, error handling, and deployment readiness.

Implementation may be delivered in phases, but phasing must not silently remove requirements from the agreed product scope.

### 2.2 Product principles

- **Local-first fulfilment:** The store serves only the configured city/service area at launch.
- **Stock accuracy:** Customers should not be able to place confirmed orders for unavailable stock.
- **Manual payment confirmation initially:** Do not represent an order as paid until an authorized administrator verifies payment.
- **Mobile-first usability:** Core shopping and order tracking must work well on mobile devices.
- **Accessible and clear:** Use readable typography, visible focus states, clear form errors, and accessible colour contrast.
- **Trust and transparency:** Show product details, prices, stock/availability, service-area rules, and order status clearly.
- **Maintainable implementation:** Use validated APIs, consistent schemas, reusable UI components, and environment-based configuration.

---

## 3. Product Categories

The primary categories are fixed as follows:

1. **Bangles**
2. **Jewellery**
3. **Dupattas**
4. **Others**

Administrators should be able to assign each product to one of these categories. Product browsing should support category filtering. If additional categories are required in the future, that should be handled through a controlled catalogue update rather than hard-coded assumptions throughout the UI.

---

## 4. Geographic and Fulfilment Requirements

### 4.1 Launch service area

- The store must serve customers only within the business’s configured local city/service area at launch.
- The supported city and any included localities or PIN codes must be configurable by an administrator or through application configuration.
- The website must clearly communicate the service-area restriction before the customer completes checkout.
- Customers outside the supported area must not be able to place an order for unavailable delivery coverage.
- Do not assume that nationwide shipping is available.
- The service-area validation must happen on the backend as well as in the frontend; frontend-only restrictions are insufficient.

### 4.2 Address and fulfilment

- Collect the customer’s name, phone number, and delivery address details needed to fulfil the order.
- Validate the address against the configured service area.
- Support the fulfilment methods actually offered by the group, such as local delivery or pickup, once the business confirms which methods are available.
- Store the selected fulfilment method and address snapshot with the order so later profile edits do not change historical order details.
- Communicate any delivery fee, delivery estimate, or pickup instructions only when the business has configured those values.

**Decision to confirm:** Exact city, supported PIN codes/localities, whether pickup is available, delivery charges, and delivery-time rules.

---

## 5. Brand and UI Design Requirements

### 5.1 Brand direction

eSakhi should feel warm, trustworthy, contemporary, community-centred, and suitable for a handmade-products brand. The interface should make product photography and product details prominent without overwhelming the customer.

### 5.2 Colour tokens

| Token | Value | Intended use |
|---|---|---|
| Primary — Deep Rose Pink | `#D6336C` | Primary buttons, active navigation, key brand elements |
| Canvas — Soft Blush | `#FDEEF0` | Soft page backgrounds and selected surfaces |
| Accent — Marigold Yellow | `#F7C948` | Small highlights, badges, decorative accents |
| Neutral text | Choose accessible dark neutral | Main text and headings |
| Neutral surface | White or near-white | Product cards, forms, panels |
| Borders | Muted neutral | Dividers, input borders, card boundaries |

The marigold accent should be used selectively. Text and controls must maintain adequate contrast and must not rely on colour alone to communicate errors or status.

### 5.3 Experience requirements

- Responsive layouts for mobile, tablet, and desktop.
- Consistent header, navigation, footer, buttons, form controls, cards, alerts, and status indicators.
- Product imagery with a consistent aspect ratio and graceful image fallbacks.
- Loading, empty, success, and error states for every data-dependent page.
- Accessible labels, keyboard navigation, visible focus indicators, semantic headings, and descriptive image alt text.
- Clear confirmation before destructive administrative actions.
- Avoid fake ratings, fabricated reviews, misleading stock claims, and unconfigured delivery promises.

---

## 6. Technical Architecture

### 6.1 Frontend

- **Framework:** React.js
- **Build tool:** Vite
- **Application type:** Single Page Application (SPA)
- **Styling:** Custom CSS components and/or Tailwind CSS utility classes
- **Architecture:** Reusable components, page-level views, shared layouts, API/service layer, form validation, and centralized handling for loading/errors.
- **Routing:** Client-side routing for public, customer, and protected admin pages.
- **API communication:** A dedicated API client configured using environment variables; do not hard-code deployment URLs or secrets.

Choose either a consistent custom-CSS approach or a consistent Tailwind approach for each component area. Avoid mixing styling patterns arbitrarily.

### 6.2 Backend

- **Runtime:** Node.js Active LTS line
- **Framework:** Express.js
- **API style:** RESTful JSON APIs
- **Responsibilities:** Authentication and authorization, catalogue, stock validation, cart/checkout validation, order creation, payment verification records, fulfilment, and admin operations.
- **Cross-cutting concerns:** Request validation, centralized error handling, security headers, rate limiting where appropriate, logging, and API versioning strategy.

### 6.3 Database

- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Data validation:** Explicit schemas, required fields, enums, indexes, and model-level validation where appropriate.
- **Data integrity:** Enforce critical business rules in backend services. Use transactions where supported and justified, and use conditional stock updates to reduce overselling risks.
- **Secrets:** Database credentials and signing secrets must be stored in environment variables or the deployment platform’s secret manager, never committed to source control.

### 6.4 Suggested high-level structure

```text
eSakhi/
├── client/                 # React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── routes/
│       ├── services/       # API client and endpoint functions
│       ├── hooks/
│       ├── context/        # Only for suitable shared client state
│       ├── utils/
│       └── styles/
└── server/                 # Node + Express
    └── src/
        ├── config/
        ├── models/
        ├── routes/
        ├── controllers/
        ├── services/
        ├── middleware/
        ├── validators/
        ├── utils/
        └── app.js
```

This is a suggested organization, not a requirement to create every folder regardless of need.

---

## 7. Functional Requirements — Customer Storefront

### 7.1 Home page

- Communicate the eSakhi brand and its handmade-products purpose.
- Display the four main categories.
- Show selected products and relevant catalogue sections based on available data.
- Provide clear routes to browse products, view product details, and access the cart.
- Show service-area information and how ordering/payment confirmation works.
- Include contact/help information configured by the business.

### 7.2 Product catalogue

- Browse products and filter by category.
- Support search by product name and, where practical, product description.
- Show product image, name, price, and availability.
- Support pagination or an equivalent scalable loading strategy.
- Handle no-results and loading states.
- Only show products that are active/published to customers.
- Respect stock status and avoid showing unavailable products as purchasable.

### 7.3 Product detail page

- Show product name, images, price, description, category, and available stock status.
- Show any product options that genuinely apply, such as size, colour, or design, only when configured for that product.
- Allow customers to choose quantity within the available stock.
- Prevent adding invalid quantities.
- Display a clear unavailable/out-of-stock state.
- Provide an add-to-cart action with visible feedback.

### 7.4 Cart

- Add, remove, and update product quantities.
- Recalculate line totals and cart subtotal.
- Validate current price and stock again on the server during checkout; never trust totals submitted by the browser.
- Persist cart state appropriately for the chosen guest/account experience.
- Explain when an item becomes unavailable or the available quantity changes.
- Show a clear empty-cart state and a path back to shopping.

### 7.5 Customer account

The full product should support a defined customer identity approach. If accounts are enabled, customers should be able to register/sign in, manage relevant profile details, save or update addresses, and view their order history.

Authentication method (phone OTP, email/password, or another method) must be confirmed before implementation. Do not claim an OTP service is available until a provider is selected and configured.

### 7.6 Checkout

- Collect and validate contact and address information.
- Validate that the order is within the configured local service area.
- Show an order summary with quantities, prices, subtotal, delivery fee if configured, and final total.
- Revalidate product activity, current prices, and stock on the backend.
- Require the customer to review the order before submitting.
- Create an order with a unique human-readable order reference.
- Show a confirmation page with the order reference and next steps for manual payment confirmation.
- Protect against duplicate submissions and accidental duplicate orders.

### 7.7 Manual payment workflow

- Clearly explain the approved payment instructions configured by the business.
- Record the selected payment method and payment status.
- Initial payment statuses should distinguish at least **Pending Verification**, **Confirmed/Paid**, and **Rejected/Unverified**.
- An authorized administrator must verify payment evidence or reconcile payment before marking an order paid.
- If payment proof upload is enabled, restrict accepted file types and sizes, store files securely, and do not expose private proof publicly.
- Record who confirmed/rejected a payment and when.
- Do not store card numbers, CVVs, UPI PINs, passwords, or other payment credentials.
- Keep manual payment confirmation separate from order fulfilment status.

**Decision to confirm:** Supported manual payment method(s), payment instructions, whether customers can upload proof, and what happens to stock while payment is pending.

### 7.8 Customer order tracking

- Display the order reference, items, totals, payment status, and fulfilment status.
- Explain status changes in plain language.
- Show order history for signed-in customers.
- Do not expose another customer’s order details through guessable IDs or insufficiently protected endpoints.
- Provide a configured contact/help route for order questions.

---

## 8. Functional Requirements — Administration

Admin routes and APIs must be protected by server-side authorization. Hiding admin controls in React is not sufficient security.

### 8.1 Admin dashboard

- Summarize orders requiring action, pending payment verification, low-stock items, and recent orders.
- Use actual database data and clearly handle empty states.
- Do not display invented analytics or placeholder business metrics as real results.

### 8.2 Product management

Authorized administrators must be able to:

- Create, edit, publish/unpublish, and archive products.
- Set product name, description, category, price, images, and stock quantity.
- Configure optional product attributes where required.
- Validate prices and stock values.
- Preview how product information appears to customers.
- Prevent accidental deletion or loss of order history; prefer archiving products referenced by orders.

### 8.3 Inventory management

- Track available stock for each product or product variant.
- Update stock when orders are placed, cancelled, or otherwise reach the agreed inventory event.
- Prevent negative stock and reduce overselling with atomic/conditional database operations.
- Warn administrators about low stock using a configurable threshold.
- Maintain an auditable record of important stock adjustments, including reason, time, and administrator.
- Define how stock is reserved and released while payment is pending.

### 8.4 Order management

Administrators must be able to:

- View and search orders by order reference, date, customer, payment status, and fulfilment status.
- Open an order and view its item, customer, address, price, and payment snapshots.
- Update fulfilment status according to permitted transitions.
- Cancel an order with a reason where policy permits.
- View payment-verification history.
- Add internal notes that are not visible to customers.
- See who performed important order actions and when.

### 8.5 Customer management

- View customer details needed for legitimate order support.
- View a customer’s order history where authorized.
- Restrict access to personal data by role and operational need.
- Avoid collecting personal information that is not needed for the service.

### 8.6 Admin accounts and roles

- Provide a secure way to create or provision the initial administrator.
- Never expose a public endpoint that lets an arbitrary visitor promote themselves to admin.
- Support role-based access if different admin/fulfilment permissions are needed.
- Log security-sensitive and business-critical actions.
- Provide a process to disable compromised or former staff accounts.

### 8.7 Configuration

Authorized users should be able to manage, or deployment configuration should safely define:

- Business name and contact details.
- Supported city/localities/PIN codes.
- Fulfilment methods.
- Delivery charges and applicable rules.
- Payment instructions.
- Low-stock threshold.
- Customer-facing policies and help content.

Any setting that changes order totals or serviceability must be validated by the backend.

---

## 9. Order and Payment Status Model

Payment and fulfilment are separate dimensions and must not be combined into one status.

### 9.1 Suggested order/fulfilment statuses

1. **Placed** — Order created and awaiting the next business action.
2. **Accepted** — Order reviewed and accepted for fulfilment.
3. **Preparing** — Items are being prepared/packed.
4. **Ready for Pickup** — Use only if pickup is supported.
5. **Out for Delivery** — Use only if local delivery is supported.
6. **Completed** — Order successfully handed over/delivered.
7. **Cancelled** — Order cancelled under the applicable policy.

The exact allowed transitions and who may perform them must be documented and enforced by the backend.

### 9.2 Suggested payment statuses

1. **Pending Verification**
2. **Confirmed/Paid**
3. **Rejected/Unverified**
4. **Refund Pending** — If refunds become applicable.
5. **Refunded** — If a refund has actually been completed.

Do not mark a payment as confirmed merely because the customer submitted a form or uploaded an image.

### 9.3 Cancellation and stock policy

Define and implement a consistent policy for when stock is reserved, released, or restored. Cancellation after preparation or completion may require different handling. These rules must be agreed before coding and tested for duplicate requests and concurrent orders.

---

## 10. Suggested MongoDB/Mongoose Data Models

The final schema should be refined during implementation. These are logical entities, not a demand to store every field exactly as listed.

### 10.1 User

- Name and contact information
- Authentication identifier/provider metadata (never plaintext passwords)
- Role and account status
- Saved addresses, if supported
- Created/updated timestamps

### 10.2 Product

- Name, slug, description, category
- Price stored as an integer in the smallest currency unit (for INR, paise) or another explicitly consistent money representation
- Image references/URLs
- Stock quantity and low-stock configuration where appropriate
- Optional variant data
- Active/archive status
- Created/updated timestamps

### 10.3 Order

- Unique order reference
- Customer reference and immutable customer/contact/address snapshot
- Item snapshots: product reference, product name, selected variant, unit price, quantity, line total
- Subtotal, delivery fee, and final total calculated on the server
- Fulfilment status and payment status
- Selected fulfilment method
- Cancellation reason, notes, and relevant timestamps
- Created/updated timestamps

### 10.4 PaymentRecord

- Order reference
- Method and amount
- Status
- Proof reference, if proof upload is enabled
- Verification result, administrator reference, timestamps, and notes
- No sensitive payment credentials

### 10.5 InventoryAdjustment

- Product/variant reference
- Quantity change
- Reason
- Administrator reference
- Timestamp and related order reference, where applicable

### 10.6 AuditLog

- Actor, action, affected resource
- Timestamp
- Safe metadata required to investigate important changes
- Do not log passwords, tokens, payment credentials, or unnecessary sensitive data.

### 10.7 Indexing and consistency

- Unique index for order reference and any unique authentication identifiers.
- Index catalogue fields used for category, active status, and search/filtering as justified.
- Index orders by customer, creation date, and statuses used in the admin dashboard.
- Validate all input and enforce critical consistency rules in the backend.
- Use transactions when multiple writes must succeed together and the deployment topology supports them.

---

## 11. REST API Requirements

The exact routes may change during implementation, but APIs should follow consistent naming, validation, authentication, authorization, and error-response conventions.

### 11.1 Public catalogue

- `GET /api/v1/products` — List/filter published products.
- `GET /api/v1/products/:slug` — Read one published product.
- `GET /api/v1/categories` — Read supported categories.
- `GET /api/v1/service-area` — Read public service-area information.

### 11.2 Customer and orders

- Authentication endpoints according to the chosen sign-in method.
- `POST /api/v1/orders` — Validate and create an order.
- Protected endpoints to read a customer’s own orders.
- A protected endpoint to retrieve a specific customer-owned order.
- Any order cancellation endpoint must validate ownership, status, and policy.

### 11.3 Admin

- Protected product create/update/archive endpoints.
- Protected inventory adjustment endpoints.
- Protected order search/detail/status endpoints.
- Protected payment verification endpoints.
- Protected configuration endpoints, if configuration is editable in the UI.

### 11.4 API conventions

- Validate request bodies, query parameters, and path parameters.
- Use appropriate HTTP status codes and a consistent error shape.
- Never trust client-submitted prices, totals, roles, payment status, or stock values.
- Enforce authentication, ownership checks, and admin authorization on the server.
- Add pagination and bounded query limits to list endpoints.
- Document APIs with an OpenAPI specification or equivalent maintained API reference.

---

## 12. Security, Privacy, and Reliability

- Hash passwords with a suitable password-hashing algorithm if password authentication is chosen.
- Use secure, appropriately configured sessions or tokens; protect cookies and authentication flows.
- Apply authorization checks to every protected API endpoint.
- Validate and sanitize inputs; avoid unsafe query construction.
- Configure CORS for known frontend origins in production.
- Use security headers, rate limiting on sensitive endpoints, and safe error messages.
- Store secrets only in environment variables/secret management.
- Use HTTPS in production.
- Restrict and validate uploaded file types and sizes; use private storage for payment proof.
- Minimize customer personal data and restrict access to it.
- Avoid logging passwords, tokens, full payment proof, or unnecessary personal information.
- Plan database backups, restoration testing, monitoring, and incident response.
- Provide graceful loading, retry/error messaging, and safe recovery from failed requests.
- Follow applicable Indian privacy, consumer, tax, and e-commerce requirements with appropriate professional review before launch.

---

## 13. Non-Functional Requirements

### Performance
- Optimize images and lazy-load non-critical imagery.
- Paginate product and order lists.
- Avoid unnecessary frontend re-renders and unbounded database queries.
- Establish measurable response-time targets after expected traffic and hosting are known.

### Accessibility
- Support keyboard navigation and visible focus.
- Use semantic HTML, labelled controls, helpful form errors, and meaningful alt text.
- Ensure contrast is adequate for text and interactive controls.

### Compatibility
- Support current mainstream mobile and desktop browsers.
- Verify layouts at common mobile, tablet, and desktop widths.

### Maintainability
- Use reusable components and a clear separation of frontend, API, business logic, and data access.
- Keep configuration separate from code.
- Use linting, formatting, consistent naming, and documented setup steps.

### Observability
- Record useful application errors and important administrative actions.
- Avoid exposing stack traces or internal details to customers.
- Provide enough operational logging to diagnose failed orders without logging secrets.

---

## 14. Testing and Acceptance Criteria

### Customer journey
- A customer can browse the four categories and open product details.
- A customer can add an in-stock product to the cart and update/remove quantities.
- The server recalculates prices and validates stock during checkout.
- A customer outside the configured service area cannot complete an order.
- A valid order receives a unique reference and an accurate order summary.
- The customer sees that payment requires manual verification.
- Customers can view only their own protected order information.

### Inventory and order integrity
- An order cannot reduce stock below zero.
- Invalid quantities, inactive products, and stale prices are rejected or safely reconciled.
- Duplicate submissions do not accidentally create duplicate orders.
- Cancellation and stock restoration follow the agreed policy.
- Order history retains product/price/address snapshots from the time of purchase.

### Admin
- Unauthenticated users cannot access admin APIs.
- Non-admin users cannot perform admin actions.
- Administrators can create/edit/archive products and manage stock.
- Administrators can search orders and update only valid statuses.
- Payment status changes require authorized verification and are auditable.

### UI and accessibility
- Core pages work on mobile, tablet, and desktop.
- Loading, empty, validation, success, and failure states are present.
- Forms are keyboard accessible and have labels and useful error messages.
- Colour is not the only indicator of payment/order state.

### Operational readiness
- A clean setup from documented instructions works in a fresh environment.
- Secrets are not committed to the repository.
- Production builds and API deployment configuration are documented.
- Backup and recovery procedures are defined and tested before launch.

---

## 15. Delivery and Deployment Requirements

- Separate frontend and backend configuration by environment.
- Provide `.env.example` files containing variable names but no real secrets.
- Configure MongoDB Atlas network access and database users with least privilege.
- Configure production CORS, HTTPS, logging, and error handling.
- Establish database backup and recovery procedures.
- Provide a README covering prerequisites, installation, local development, environment variables, tests, build, and deployment.
- Include seed data only for development/demo environments; do not expose fake customer/order records in production.
- Define a rollback and recovery plan for production releases.

---

## 16. Future-Ready Extensions

These are possible future extensions, not promises that they will be available at launch:

- Online payment gateway integration.
- Additional cities or shipping partners.
- Product reviews and ratings with moderation.
- Wishlist and saved products.
- Discount codes and campaigns.
- Sales and inventory reports.
- Customer notifications through configured email/SMS/WhatsApp providers.
- Multiple admin roles and more detailed analytics.
- Multilingual interface support.

Architecture should avoid unnecessarily blocking these extensions, but the launch product must not display disabled or unconfigured features as if they work.

---

## 17. Open Decisions Before Implementation

The following need confirmation with the business:

1. **Local service area:** Exact city, PIN codes/localities, and whether the boundary is city-wide or a selected set of areas.
2. **Fulfilment:** Local delivery, pickup, or both; who fulfils orders.
3. **Payment:** Accepted manual payment methods, instructions, payment-proof upload, and verification process.
4. **Pending-payment stock:** Whether stock is reserved immediately, for how long, and when it is released.
5. **Authentication:** Guest checkout, customer accounts, phone OTP, or email/password.
6. **Delivery pricing:** Fixed fee, locality-based fee, free-delivery threshold, or no delivery charge.
7. **Returns/cancellations:** Eligibility, time limits, cancellation rules, and refund process.
8. **Product options:** Whether any products have size/colour/design variants.
9. **Images:** Where product images will be stored and who can upload/manage them.
10. **Admin access:** Number of administrators and whether fulfilment staff need separate permissions.
11. **Customer support:** Official phone number, WhatsApp number, email, and business hours.
12. **Policies:** Approved privacy, terms, shipping/fulfilment, returns, and cancellation wording.

---

## 18. Definition of Done

The product is ready for launch only when:

- The agreed customer shopping and checkout journey works end-to-end.
- The four categories are available and product/inventory management works.
- Local service-area rules are enforced by both UI and backend.
- Manual payment verification is operational and auditable.
- Order and payment statuses remain separate and follow documented transitions.
- Admin access and customer order privacy are tested.
- Acceptance criteria and key failure cases pass.
- Production configuration, backups, monitoring/logging, and recovery steps are documented.
- Business policies and all open decisions required for launch have been approved.

---

## 19. Change Log

| Version | Date | Notes |
|---|---|---|
| 1.0 | 20 October 2026 | Initial PRD draft based on requirements available in the conversation. |
