# eSakhi Frontend Implementation Plan

## 1. Purpose and product direction

Build a complete, responsive customer storefront and admin workspace for eSakhi, a marketplace for handmade products made by women in self-help groups (SHGs). The frontend should make shopping feel trustworthy and simple while respectfully telling the makers' story.

The visual direction is warm, contemporary, handmade, and editorial—not a generic marketplace template. Use the supplied brand emblem and PRD palette as the design foundation. Product and maker imagery should feel natural, tactile, and realistic. Use subtle depth and dimensional styling to make the interface feel polished; avoid exaggerated 3D effects that compete with the products or make the shop feel artificial.

## 2. Inputs and source of truth

- `eSakhi_PRD.md` defines the intended customer journey, admin capabilities, brand direction, and responsive/accessibility requirements.
- `Story_of_SHGs.md` provides the narrative for the maker-story section and home-page hero.
- `E Sakhi Handmade Emblem.png` is the provided brand asset. Preserve its proportions and colors; do not redraw or distort it.
- `backend/docs/API.md` documents the backend routes and request/response behavior currently available.
- `.github/instructions/api-documentation.instructions.md` applies when frontend work requires a backend API contract change: update the API guide and related developer documentation with the change.
- `backend/docs/PRD-INSTRUCTION-REVIEW.md` records current backend limitations and launch gates.

The PRD is marked as a draft and notes that its original linked source was not independently reviewed. Confirm it against the approved business requirements before treating it as final.

## 3. Current workspace status and implementation boundaries

- The repository currently contains a backend only; there is no React/Vite frontend to extend.
- The backend supports OTP authentication, public product/category browsing, customer profiles and addresses, checkout/order creation, customer order history, and protected admin operations for products, stock, orders, customers, and store settings.
- Product records accept HTTPS image URLs. Product image upload/storage is not implemented.
- There are no backend APIs/models for gift cards, promotional banners/carousels, reviews, wishlists, or payment-proof uploads. Do not present these as working features until their APIs and business rules are agreed and implemented.
- The backend's current routes and validations are authoritative. The frontend must not fabricate data, infer unsupported fields, or claim a customer action succeeded before the API confirms it.
- **Dynamic-data requirement:** all live catalogue, prices, stock, service-area/payment/fulfilment settings, customer identity, orders, dashboard metrics, customer records, and admin-managed content must come from the backend. Never hardcode product cards, prices, stock, order totals/statuses, customer data, dashboard numbers, or store settings in frontend source.
- Hardcoded brand assets, approved editorial story copy, shared UI labels, category presentation metadata, and loading/empty-state illustrations are acceptable. They must not masquerade as current business/database data. Category names and available choices should be reconciled with the categories/configuration returned by the API, not used to fabricate catalogue data.

## 4. Brand and visual system

### Brand

- Use the supplied emblem in the storefront header, footer, sign-in experience, and admin navigation where appropriate.
- Keep the image's aspect ratio, use a transparent-background-aware layout, and provide meaningful alternative text. Avoid using a large logo where it would displace shopping content.
- Supporting brand line from the supplied story: **“eSakhi — Handmade with Love. Empowered by You.”**

### Color and component direction

Start from the PRD palette:

- Deep rose pink `#D6336C` for primary brand actions and selected navigation.
- Soft blush `#FDEEF0` for selected or gentle background surfaces.
- Marigold `#F7C948` for restrained highlights—not small text on a light background.
- Accessible neutral text, surfaces, borders, and semantic status colors selected and contrast-checked during design.

Use a consistent spacing scale, type scale, radii, shadows, icon style, and component states. Keep cards tactile and elevated with restrained shadows, fine borders, and layered surfaces. Make motion brief and optional; respect `prefers-reduced-motion`.

### Image direction

- Prioritize authentic, consented photographs of the SHG members, their process, products, and finished pieces. The hero should depict women actually making or working together, not generic stock imagery presented as the eSakhi group.
- The story describes Sita and the group. Do not imply that an identifiable photographed person is Sita unless the business confirms that identity and has permission to publish it.
- Use realistic product photography with consistent crops, true colors, visible handmade details, and responsive image sizing. Do not add fake ratings, reviews, scarcity labels, or unsupported product claims.
- If authentic images are not yet available, use clearly labeled temporary assets or neutral placeholders. Do not publish AI-generated or stock portraits as documentary evidence of the actual SHG.
- Supply descriptive alt text for informative images and empty alt text for purely decorative visuals.
- Add an image inventory and content checklist as part of implementation; verify rights, consent, file size, crop, and mobile legibility before release.

## 5. Theme behavior: light, dark, and system

Offer **System / Light / Dark** modes across both the customer experience and admin area.

- Default to the operating system preference until a user chooses a mode.
- Persist an explicit choice on the device; a theme setting does not need a backend endpoint for the first implementation.
- Apply the theme before the page is painted where practical to reduce a flash of the wrong theme.
- Define semantic color tokens for both schemes instead of simply inverting colors. Retain eSakhi's rose identity and ensure product photography stays unfiltered.
- Test text, controls, focus rings, disabled states, alerts, badges, charts, dialogs, and navigation in both themes.
- Meet WCAG 2.2 AA contrast targets: at least 4.5:1 for normal text and 3:1 for large text and relevant non-text controls. Do not communicate status using color alone.

## 6. Frontend structure and technical approach

Create a React + TypeScript + Vite single-page application, consistent with the PRD:

- Use client-side routing with separate public/customer and protected admin layouts.
- Keep a typed API client and endpoint functions separate from page components. Configure the API base URL via a frontend environment variable, with no secrets in browser configuration.
- Centralize auth/session handling, request cancellation where appropriate, API error parsing, and loading/retry behavior.
- Use reusable accessible components for buttons, inputs, selects, dialogs, alerts, product cards, price displays, status badges, pagination, image fallbacks, and empty/loading states.
- Validate forms at the UI boundary for helpful feedback, but always treat backend validation as authoritative.
- Keep the cart client-side for the initial frontend unless a durable/server-side cart is explicitly added to the backend. Revalidate price, activity, and stock through the order API at checkout; never trust client-calculated totals.
- Document frontend setup, environment variables, and commands after the frontend scaffold exists.

Suggested organization:

```text
frontend/
  public/
    images/
  src/
    app/
    components/
    features/
      auth/
      catalog/
      cart/
      checkout/
      orders/
      admin/
    layouts/
    pages/
    services/
    styles/
    types/
```

Keep the component and styling approach consistent; do not introduce a large design system or state-management dependency without a concrete need.

## 7. Routes and page requirements

### Public storefront

- **Home (`/`)** — Brand-led hero, clear “Shop handmade” action, category shortcuts, available featured/active products from the API, service-area/payment guidance, and maker-story preview.
- **Shop (`/shop`)** — Active products, category filtering (Bangles, Jewellery, Dupattas, Others), search if supported by the current API, pagination, and clear loading/error/no-results states.
- **Product detail (`/products/:slug`)** — Product images, name, description, price, stock/availability, quantity selection within current stock, add-to-cart feedback, and a graceful missing/unavailable state.
- **Our story (`/our-story`)** — An accessible, editorial presentation of `Story_of_SHGs.md`, including SHG collaboration, craft, opportunity, and the meaning behind a purchase. Avoid promises that cannot be substantiated.
- **Service area/help** — Show only service area, fulfilment options, payment instructions, contacts, and policies returned/configured by the backend. Explain when checkout is unavailable.
- **Authentication** — Request and verify phone OTP; explain the steps without exposing OTPs in the UI, logs, or URLs. New OTP accounts are customers by default.

### Customer account

- **Profile and addresses** — Read/update the authenticated user's profile and saved addresses.
- **Cart (`/cart`)** — Update quantities, remove items, show subtotal and availability, handle empty-cart state, and prompt sign-in when required by the order API.
- **Checkout (`/checkout`)** — Collect the required address and fulfilment/payment selections supported by settings; show the server-confirmed order total and errors.
- **Order confirmation and history** — Show the real order reference and next steps; list only the current customer's orders and show payment and fulfilment states in plain language.
- **Order details** — Display the customer's own order, item/address snapshots, and eligible cancellation request action.

### Admin workspace

- **Admin sign-in/access guard** — Require an authenticated server-issued session and an admin role. A customer or staff user must never gain admin access by changing client-side state or a URL.
- **Dashboard** — Display real API-backed operational summaries and explicit empty/error states.
- **Products** — List, create, edit, activate/deactivate, and archive products using only schema-supported fields. Support HTTPS image URLs and preview/fallback behavior; do not promise uploads.
- **Inventory** — Show current stock and use the dedicated adjustment API with a reason; clearly confirm the result.
- **Orders and fulfilment** — Search/filter using supported query parameters; view order details; update permitted fulfilment state; add internal notes; keep staff-visible and admin-only actions distinct.
- **Payment/cancellation reviews** — Admin-only review controls with confirmation, required reasons/notes as specified by the API, and clear outcome/status feedback.
- **Customers and access** — Show customer records/order history within backend permissions; role/status actions must be admin-only and confirmed before submission.
- **Settings** — Edit only fields in the settings schema. Warn when a change affects serviceability, payment methods, fulfilment, or order totals.

## 8. Backend integration and known gaps

Integrate only against routes listed in `backend/docs/API.md`. Before connecting a screen, confirm its required fields and error statuses against the current schemas and controller behavior.

For each API-backed view, implement:

- Initial loading, retryable failure, empty data, success, and mutation-in-progress states.
- User-safe error messages while preserving field-level validation information where returned.
- Session expiry handling without redirect loops; refresh uses the HttpOnly cookie and the access token remains out of persistent browser storage where practical.
- Role-aware navigation for usability, backed by server authorization for security.
- Correct handling of `401`, `403`, validation responses, unavailable database/service (`503`), and stale/archived/out-of-stock product or order states.
- Read current values from API responses and update screens from confirmed responses or a deliberate refetch. Do not use fixture/demo values as live data or maintain a frontend-only competing source of truth for business records.
- Before frontend implementation is considered planned or complete, map **every current route** in the endpoint coverage matrix below to a screen/action, shared session/API service, health check, or explicit integration test. When backend routes change, reconcile this matrix against `backend/docs/API.md`.

### Complete current backend endpoint coverage matrix

All 39 endpoints listed in the current API guide are accounted for below. “Coverage” means the frontend integration plan identifies how the endpoint is used or how its contract is verified; it does not require exposing infrastructure-only health routes as shopper-facing screens.

| Method and endpoint | Planned frontend coverage |
|---|---|
| `GET /` | API root contract smoke test during frontend integration; no storefront dependency. |
| `GET /api/v1` | API discovery/contract smoke test and troubleshooting; no hardcoded feature claims based on discovery response. |
| `GET /health` | Liveness check in deployment/integration verification, not a customer page. |
| `GET /ready` | Database readiness check in deployment/integration verification; present service-unavailable UI when dependent API calls fail. |
| `POST /api/v1/auth/otp/request` | Phone sign-in: request code, show cooldown/rate-limit/provider errors. |
| `POST /api/v1/auth/otp/verify` | Phone sign-in: verify code, establish session and route using returned identity/role. |
| `POST /api/v1/auth/refresh` | Shared API/session client: refresh access token using HttpOnly cookie, then retry eligible request once. |
| `POST /api/v1/auth/logout` | Account menu and session cleanup; clear client auth state even if logout request errors. |
| `GET /api/v1/auth/me` | Session bootstrap and account/profile screens; determine actual role from server response. |
| `PATCH /api/v1/auth/me` | Customer account profile edit form. |
| `PUT /api/v1/auth/me/addresses` | Customer saved-address management; replace list only with validated user-selected values. |
| `GET /api/v1/categories` | Shop category navigation/filter choices; render returned categories. |
| `GET /api/v1/products/categories` | API alias contract verification; use the canonical category endpoint for normal UI unless integration tests require both. |
| `GET /api/v1/products` | Home product sections and paginated shop/catalogue; query via supported category, search, page, and limit parameters. |
| `GET /api/v1/products/:slug` | Product detail page populated from the active product response. |
| `GET /api/v1/service-area` | Service-area notice and checkout configuration; show unconfigured/unavailable state rather than inventing rules. |
| `POST /api/v1/orders` | Checkout submit; send item IDs/quantities and idempotency key, then show server-calculated order/payment instructions. |
| `GET /api/v1/orders` | Customer order history with server pagination. |
| `GET /api/v1/orders/:id` | Customer-owned order detail and tracking; respect not-found/ownership behavior. |
| `POST /api/v1/orders/:id/cancellation-requests` | Eligible customer order cancellation request, with confirmation and API-driven outcome. |
| `GET /api/v1/admin/dashboard` | Protected admin dashboard using only returned operational metrics and real empty states. |
| `GET /api/v1/admin/customers` | Protected, paginated customer list. |
| `GET /api/v1/admin/customers/:customerId` | Protected customer support/detail view. |
| `GET /api/v1/admin/customers/:customerId/orders` | Protected customer order history from the admin customer view. |
| `PATCH /api/v1/admin/users/:userId/role` | Admin-only role change control; only backend-allowed roles, confirmation and response-driven update. |
| `PATCH /api/v1/admin/users/:userId/status` | Admin-only account enable/disable control with confirmation and response-driven update. |
| `GET /api/v1/admin/products` | Protected admin catalogue table with server filters and pagination. |
| `POST /api/v1/admin/products` | Admin product creation form using the current schema; images are HTTPS URLs, not uploads. |
| `PATCH /api/v1/admin/products/:id` | Admin product edit form; stock changes remain on inventory route. |
| `DELETE /api/v1/admin/products/:id` | Admin archive action (soft archive), destructive-action confirmation, and refreshed API state. |
| `GET /api/v1/admin/orders` | Protected order work queue with supported search, date, payment, fulfilment, and pagination filters. |
| `GET /api/v1/admin/orders/:id` | Protected order detail for fulfilment staff/admin, with role-appropriate fields/actions. |
| `PATCH /api/v1/admin/orders/:id/fulfilment` | Staff/admin permitted fulfilment transition action; enforce allowed server transitions and show conflict errors. |
| `POST /api/v1/admin/orders/:id/notes` | Staff/admin internal note form; never render these notes in customer views. |
| `POST /api/v1/admin/orders/:id/payment-review` | Admin-only payment verification/rejection with required note and explicit confirmation. |
| `POST /api/v1/admin/orders/:id/cancellation-review` | Admin-only cancellation decision with policy/conflict handling. |
| `GET /api/v1/admin/settings` | Admin settings page initial data; support the documented `null`/not-yet-configured state. |
| `PUT /api/v1/admin/settings` | Admin settings form; submit the complete validated settings contract and reflect confirmed response. |
| `POST /api/v1/admin/inventory/:productId/adjustments` | Admin inventory adjustment with quantity/reason, optional variant, confirmation, and returned stock state. |

For every matrix row, confirm method, path, role, payload/query schema, success envelope/status, and documented error behavior against `backend/docs/API.md` and source schemas before coding. Shared auth/session calls may serve many screens; do not duplicate session logic in each page.

Backend work requiring separate approval/planning before promising UI:

1. Secure image upload/storage/CDN and product image management beyond URL entry.
2. Gift-card product model, redemption/value/expiry/refund rules, customer flows, and admin controls.
3. Homepage campaign/banner/carousel model, image management, ordering, scheduling/activation, and public read API.
4. Reviews/ratings, wishlist, and persistent multi-device cart if required by the final product scope.
5. Payment-proof upload or payment gateway integration, plus approved refund policy.

Any new API behavior must be implemented and secured on the backend, validated, tested, and documented in `backend/docs/API.md` in the same change.

## 9. Delivery phases

### Phase 0 — Confirm content and decisions

- Validate the draft PRD against the approved source.
- Confirm service-area content, fulfilment/payment wording, policies, support contacts, and real business configuration.
- Collect approved logo variants if available, product photographs, consented SHG/process photographs, and product image rights.
- Agree which unsupported features (uploads, carousel, gift cards) are launch requirements versus later work.

### Phase 1 — Frontend foundation and visual system

- Add the frontend app and local development scripts without disturbing the backend.
- Establish brand tokens, responsive layouts, accessible shared components, route structure, API client, auth/session behavior, and system/light/dark theme.
- Validate the emblem on light and dark surfaces and add proper image loading/fallback behavior.

### Phase 2 — Customer shopping journey

- Implement home/story, categories/shop, product details, cart, OTP sign-in, checkout, order confirmation/history/details, and cancellation requests.
- Integrate the supported public/customer API routes and configured settings.
- Exercise success, empty, validation, unavailable stock, unauthorized, and service/database error states.

### Phase 3 — Admin operations

- Implement admin-only dashboard, product management, inventory, customer/order views, fulfilment, notes, reviews, and settings.
- Verify admin/staff/customer navigation and permissions against the backend; test forbidden actions directly as well as hiding unavailable controls.

### Phase 4 — Quality, content, and release readiness

- Test supported desktop/tablet/mobile sizes and major browsers.
- Check keyboard and screen-reader flows, focus visibility, reduced motion, and WCAG contrast in all themes.
- Test API integration against a non-production database with representative records.
- Check image weight/responsive delivery, broken links, production configuration, and no secret leakage in built assets.
- Obtain business approval of content, prices, image consent, policies, and service area before production.

## 10. Acceptance criteria

- The storefront and admin experience are usable at mobile, tablet, and desktop widths.
- The logo is displayed without distortion and has suitable alt text.
- The home-page hero communicates the SHG maker story using authentic, approved imagery or an honest placeholder.
- Product and maker photos are realistic, rights-cleared, responsive, and never represented with fabricated claims.
- Theme selection supports System, Light, and Dark consistently across all routes and remains readable/usable in each.
- Product catalogue and customer/admin actions reflect backend responses; no mock success or invented operational data appears in production UI.
- All 39 current backend endpoints are represented in the coverage matrix, and each is integrated where a user workflow needs it or covered by a documented health/contract verification.
- Live business values—including products, prices, stock, settings, dashboard/customer/order data, and status transitions—are API-driven rather than hardcoded; mock fixtures are confined to tests/storybook or clearly isolated development previews.
- The frontend handles pagination and filters from API metadata/query contracts rather than assuming a fixed number of products, customers, or orders.
- Customer, staff, and admin authorization paths are tested; protected backend actions cannot be enabled by client-side manipulation.
- Forms expose accessible labels and actionable validation errors; loading, empty, success, and failure states are present for data-driven pages.
- Checkout totals and order outcomes come from the backend, and stock/order errors are explained without losing the cart unnecessarily.
- Backend API documentation is updated for any API contract changes made to support the frontend.

## 11. Decisions needed before implementation

1. Is the draft `eSakhi_PRD.md` approved, or should it first be checked against the original requirements document?
2. Can the business provide real product and SHG-work photographs, with consent to publish them? Who will approve the imagery and captions?
3. Should the first release use product image URLs only, or is secure image upload/storage a launch requirement?
4. Are homepage carousel/banner management and gift cards required now, or should they follow the existing storefront/admin scope?
5. What are the final support contact, service-area, delivery/pickup, payment, and policy details?
6. Should the customer cart remain device-local initially, or must it persist across devices/accounts?
