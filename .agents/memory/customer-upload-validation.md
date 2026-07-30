---
name: Customer upload validation
description: Replit Object Storage constraint for anonymous, security-sensitive uploads
---

For anonymous customer uploads that must enforce file type and size, do not
assume the Object Storage signed PUT URL enforces metadata declared when the URL
was requested. Route the bytes through an application endpoint with a hard body
limit, bind the approved path/type/size in an expiring HMAC proof, and verify
stored metadata before using the object.

**Why:** Adversarial testing showed a signed PUT accepted bytes that did not
match the size and content type supplied when requesting the URL. Trusting those
declarations allows oversized or invalid content to reach later in-memory
processing.

**How to apply:** Use this pattern for anonymous uploads that feed AI, parsers,
or other costly processing. Recheck both object metadata and downloaded byte
length before loading the content into the downstream service.