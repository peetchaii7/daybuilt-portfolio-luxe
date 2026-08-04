---
name: Production AI result parity
description: Published AI flows require matching frontend, API, database, secrets, and protected image reads.
---

When a result page shows a saved concept summary without an image, verify the published frontend, API artifact, production database, AI integration configuration, and protected object read as one flow.

**Why:** The UI can render a persisted summary and completion message independently while omitting the comparison when `generatedImageUrl` or the protected image response is missing; development success does not prove production parity.

**How to apply:** Before attributing the issue to provider credits, compare development and production lead states, inspect deployment request logs, and assert both the generation response and the authenticated image response in a fresh production test.