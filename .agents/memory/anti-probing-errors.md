---
name: Anti-probing error responses
description: Token-protected lead endpoints must not reveal whether a lead id exists.
---

Rule: on customer-token-protected lead endpoints (images, generation), authenticate before revealing record existence, and return an identical status + body for "wrong token" and "nonexistent lead" (401). 404s are reserved for authenticated callers (owner/admin) hitting a missing resource.

**Why:** the original implementation returned 404 for missing leads before checking the token, letting anonymous callers enumerate which lead ids exist. Tests in `image-read-security.test.ts` assert indistinguishability by comparing response pairs.

**How to apply:** any new customer-facing lead route should reuse `authenticateCustomer` (generation routes) or replicate its auth-before-existence ordering, and add a probing-indistinguishability test comparing existing-id vs nonexistent-id responses.
