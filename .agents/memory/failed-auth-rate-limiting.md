---
name: Failed auth rate limiting
description: Anonymous customer-token probing is throttled per client address while valid customer polling remains unaffected.
---

Failed-token throttling can be safely scoped to the protected lead image and generation routes because valid-token requests bypass the failure bucket.

**Why:** Customer generation polling must continue during a burst from the same client, while repeated guesses should stop consuming database and object-storage resources.

**How to apply:** Treat an in-memory limiter as single-process protection only; move the bucket state to a shared store before relying on the limit across multiple API instances.