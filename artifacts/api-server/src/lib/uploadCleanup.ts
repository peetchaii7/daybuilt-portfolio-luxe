import { db, leadsTable } from "@workspace/db";
import { isNotNull } from "drizzle-orm";

import { logger } from "./logger";
import { ObjectStorageService, objectStorageClient } from "./objectStorage";

/**
 * Uploads younger than this are never touched: the customer may still be
 * filling out the Design Studio form.
 */
const ABANDONED_UPLOAD_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

/** How often the periodic sweep runs. */
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

/**
 * Delete abandoned customer uploads: objects under the private `uploads/`
 * prefix that are older than the age window and not referenced by any lead's
 * imageUrl. Returns the number of objects deleted.
 */
export async function cleanupAbandonedUploads(): Promise<number> {
  const objectStorageService = new ObjectStorageService();

  let privateDir = objectStorageService.getPrivateObjectDir();
  if (privateDir.endsWith("/")) {
    privateDir = privateDir.slice(0, -1);
  }
  // privateDir is like "/bucket-name/.private"
  const parts = privateDir.replace(/^\/+/, "").split("/");
  const bucketName = parts[0];
  const dirPrefix = parts.slice(1).join("/"); // e.g. ".private"
  const uploadsPrefix = dirPrefix ? `${dirPrefix}/uploads/` : "uploads/";

  // Object paths referenced by any lead (e.g. "/objects/uploads/<id>").
  const rows = await db
    .select({ imageUrl: leadsTable.imageUrl })
    .from(leadsTable)
    .where(isNotNull(leadsTable.imageUrl));
  const referenced = new Set(
    rows
      .map((r) => r.imageUrl)
      .filter((u): u is string => typeof u === "string" && u.length > 0),
  );

  const [files] = await objectStorageClient
    .bucket(bucketName)
    .getFiles({ prefix: uploadsPrefix });

  const cutoff = Date.now() - ABANDONED_UPLOAD_MAX_AGE_MS;
  let scanned = 0;
  let deleted = 0;

  for (const file of files) {
    scanned++;

    // Normalize the raw object name back to the "/objects/..." entity path
    // used in leads.imageUrl.
    const entityId = dirPrefix
      ? file.name.slice(dirPrefix.length + 1)
      : file.name;
    const objectPath = `/objects/${entityId}`;

    if (referenced.has(objectPath)) {
      continue; // never delete an object a lead points at
    }

    const createdRaw = file.metadata?.timeCreated;
    const createdAt = createdRaw ? Date.parse(String(createdRaw)) : NaN;
    if (!Number.isFinite(createdAt) || createdAt > cutoff) {
      continue; // too young (or unknown age) — keep it
    }

    try {
      await file.delete({ ignoreNotFound: true });
      deleted++;
    } catch (err) {
      logger.warn(
        { err, objectPath },
        "Failed to delete abandoned upload; will retry next sweep",
      );
    }
  }

  logger.info(
    { scanned, deleted },
    "Abandoned upload cleanup finished",
  );
  return deleted;
}

/**
 * Run the cleanup once at startup and then on an interval. Errors are logged
 * and never crash the server.
 */
export function startAbandonedUploadCleanup(): void {
  const run = () => {
    cleanupAbandonedUploads().catch((err) => {
      logger.error({ err }, "Abandoned upload cleanup failed");
    });
  };
  run();
  const timer = setInterval(run, CLEANUP_INTERVAL_MS);
  // Never keep the process alive just for cleanup.
  timer.unref?.();
}
