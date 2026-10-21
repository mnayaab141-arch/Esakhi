---
name: esakhi-postman-collections
description: "Create, organize, or refresh category-wise Postman collections for the eSakhi backend. Use when asked to make an eSakhi Postman collection, group API requests by feature, or keep the Postman collection aligned with backend routes."
argument-hint: "Optionally name the Postman workspace or collection to create/update."
user-invocable: true
---

# eSakhi Postman Collections

Create or update a Postman collection organized around the current eSakhi backend API. Prefer the connected Postman workspace over local exports when the user asks to create it in Postman.

## Workflow

1. **Inspect the current API before generating requests.**
   - Read `backend/src/app.ts` and the route files in `backend/src/modules/`.
   - Read related controller/schema files and `backend/docs/API.md` for request bodies, query parameters, authorization, and response behavior.
   - Check `backend/.env.example` for the local port and environment variable names. Do not read or expose `backend/.env`, API keys, tokens, MongoDB connection strings, or other secrets.
   - Include only routes that exist in the current source. Do not infer API endpoints from database collections or old Postman exports.

2. **Choose the right Postman workspace and avoid duplicates.**
   - Use Postman tools to list workspaces and select the exact workspace requested. If none is named, use the existing eSakhi workspace when one is available; do not create another workspace.
   - List collections in that workspace before creating anything.
   - Preserve existing collections. If a collection with the requested category-wise purpose already exists, inspect it and update it only when a suitable Postman update operation is available and the intended changes are clear. Otherwise ask before creating a duplicate or replacing content.
   - Create the collection in the selected workspace explicitly; never rely on a default workspace.

3. **Build a Postman Collection v2.1.0.**
   - Group requests into feature folders based on the routes actually found. Common eSakhi groups include Health/API discovery, Authentication/Profile, Public Catalog/Service Area, Customer Orders, Admin Customers/Dashboard, Admin Catalog, Admin Orders/Fulfilment, and Admin Settings/Inventory.
   - Use the correct HTTP methods, route paths, query parameters, and JSON bodies from source schemas and documentation.
   - Use collection-level Bearer authentication with `{{accessToken}}` for protected routes. Set public requests to `noauth` so they do not inherit collection auth.
   - Add non-secret collection variables such as `baseUrl`, `accessToken`, and relevant resource IDs. Use the backend's configured local port as the `baseUrl` default; never put credentials or real user data in variables.
   - Use placeholder/sample data only. Clearly label admin write operations and requests that can change or archive data. Do not send requests to the API as part of collection creation unless the user explicitly asks to run them.
   - For OTP flows, describe the refresh-cookie behavior and avoid embedding a real OTP or access token.

4. **Create or update, then verify.**
   - Use the Postman collection operation that matches the required scope and payload.
   - Re-read the resulting collection or its map and verify the workspace, collection name, folder names, and request paths/methods.
   - Report the created or updated collection and workspace, folder groups, and any requests omitted because the current API does not support them.

## Safety and accuracy

- Never expose secrets found in configuration or tool responses.
- Never delete the existing collection or replace its contents without explicit user approval.
- Do not claim that an endpoint was tested merely because a request was added to Postman.
- If workspace access or the required Postman operation is unavailable, report the blocker and offer a local export as an alternative instead of silently claiming success.
