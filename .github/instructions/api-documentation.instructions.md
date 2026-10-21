---
applyTo: "backend/**/*"
---

# Keep backend documentation current

When a backend change alters behavior or information developers rely on, update the relevant documentation in the same change.

## API contract changes

For externally observable API changes, update `backend/docs/API.md`. Treat route registration, request schemas, controllers, authentication/authorization middleware, response helpers, and error handling as API contract sources. Document changed or added methods and paths, authentication/roles, parameters and request bodies, success responses and status codes, expected error statuses/codes, and relevant workflow scenarios or limitations. Remove documentation for behavior that no longer exists.

## Setup and operational changes

When prerequisites, supported runtime versions, install/run/test commands, environment variables, database requirements, deployment behavior, or operational limitations change, update `backend/README.md` and any directly affected example/configuration documentation such as `backend/.env.example`.

When a feature's intended behavior, known limitation, or deliberate deviation from the product requirements changes, update the relevant product/review documentation as well. Do not treat internal implementation details as product behavior unless they affect developers or API consumers.

## Before finishing

- Identify the documentation files affected by the code change and update them in the same change.
- Verify route, schema, controller, and middleware behavior against the API guide when the contract changes.
- Keep examples valid against current validation schemas and commands appropriate for the documented operating system.
- Use placeholders only; never include secrets, tokens, connection strings, or real user data.
- Do not make documentation-only churn for internal refactors that do not alter documented behavior.
