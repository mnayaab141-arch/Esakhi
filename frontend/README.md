# eSakhi frontend

React, TypeScript, and Vite customer storefront and admin workspace.

## Run locally

From this directory:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

The Vite development server defaults to `http://localhost:5173` and proxies API calls to `http://localhost:5001`. Set `VITE_API_PROXY_TARGET` in `.env` if the backend runs at a different origin. Alternatively, set `VITE_API_BASE_URL` to the API origin for a deployment that does not use the Vite proxy. Browser requests include credentials for the HttpOnly refresh cookie; configure the backend's `CLIENT_ORIGINS` to allow the frontend origin when calling the API directly.

Run the production type-check and build with:

```powershell
npm run build
npm run preview
```

## Current integration

The frontend has customer flows for OTP sign-in, product discovery, cart, checkout, profile, saved address, order history, and optional order push notifications. The protected workspace includes dashboard, product management, inventory, orders, customers, settings, and non-mutating API checks. The endpoint map in the root `plan.md` tracks backend routes.

Admin accounts must be provisioned securely through the backend's `npm run admin:create` command; customer self-registration never grants admin access. Admins can upload product images from the product editor. Gift-card and promotional-banner/carousel management are not available in the backend and are not presented as active frontend features.

The supplied emblem is stored at `public/images/esakhi-emblem.png`. Admins can upload up to 10 JPEG, PNG, or WebP product images (5 MB each) from the product editor. The backend stores those images in its `uploads/product-images/` directory, which must use persistent storage for deployed environments. Real product and maker photographs, business-approved copy, service area, and payment configuration should be supplied by the business; the interface does not invent catalogue or operational records.

To enable web push, configure the `VITE_FIREBASE_*` public web-app values and `VITE_FIREBASE_VAPID_KEY` in `.env`; configure `FIREBASE_SERVICE_ACCOUNT_JSON` only on the backend. Push delivery is optional and requires user permission and a supported browser secure context (localhost or HTTPS).
