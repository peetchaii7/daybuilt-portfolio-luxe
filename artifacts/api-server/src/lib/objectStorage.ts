import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import { File, Storage } from '@google-cloud/storage';

import {
  canAccessObject,
  getObjectAclPolicy,
  ObjectAclPolicy,
  ObjectPermission,
  setObjectAclPolicy,
} from './objectAcl';
import { MAX_UPLOAD_BYTES, type UploadProofClaims } from './uploadProof';

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';

export const objectStorageClient = new Storage({
  credentials: {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: 'external_account',
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: 'json',
        subject_token_field_name: 'access_token',
      },
    },
    universe_domain: 'googleapis.com',
  },
  projectId: '',
});

/**
 * Content types accepted for customer room photo uploads and for anything we
 * are willing to hand to the image model / stream back from private storage.
 */
export const ALLOWED_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export function isAllowedImageContentType(
  contentType: string | null | undefined,
): boolean {
  if (!contentType) {
    return false;
  }
  const normalized = contentType.split(';')[0].trim().toLowerCase();
  return (ALLOWED_IMAGE_CONTENT_TYPES as readonly string[]).includes(
    normalized,
  );
}

export function extensionForImageContentType(
  contentType: string | null | undefined,
): string {
  const normalized = (contentType ?? '').split(';')[0].trim().toLowerCase();
  switch (normalized) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    default:
      return 'bin';
  }
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    const paths = Array.from(
      new Set(
        pathsStr
          .split(',')
          .map((path) => path.trim())
          .filter((path) => path.length > 0),
      ),
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          'tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths).',
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || '';
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          'tool and set PRIVATE_OBJECT_DIR env var.',
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  async downloadObject(
    file: File,
    cacheTtlSec: number = 3600,
  ): Promise<Response> {
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const isPublic = aclPolicy?.visibility === 'public';

    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    const headers: Record<string, string> = {
      'Content-Type':
        (metadata.contentType as string) || 'application/octet-stream',
      'Cache-Control': `${isPublic ? 'public' : 'private'}, max-age=${cacheTtlSec}`,
    };
    if (metadata.size) {
      headers['Content-Length'] = String(metadata.size);
    }

    return new Response(webStream, { headers });
  }

  /**
   * Download a private object into memory. Used for handing the customer's
   * room photo to the image model.
   */
  async downloadObjectBuffer(
    objectPath: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const file = await this.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const contentType =
      (metadata.contentType as string | undefined) ??
      'application/octet-stream';
    const size = Number(metadata.size ?? 0);
    if (!Number.isFinite(size) || size < 1 || size > MAX_UPLOAD_BYTES) {
      throw new Error('Source image exceeds the allowed size');
    }
    const [buffer] = await file.download();
    if (buffer.length < 1 || buffer.length > MAX_UPLOAD_BYTES) {
      throw new Error('Source image exceeds the allowed size');
    }
    return { buffer, contentType };
  }

  async validateCustomerUpload(claims: UploadProofClaims): Promise<boolean> {
    try {
      const file = await this.getObjectEntityFile(claims.objectPath);
      const [metadata] = await file.getMetadata();
      const actualType = String(metadata.contentType ?? '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      const expectedType = claims.contentType.split(';')[0].trim().toLowerCase();
      const actualSize = Number(metadata.size ?? 0);
      return (
        isAllowedImageContentType(actualType) &&
        actualType === expectedType &&
        actualSize === claims.size &&
        actualSize > 0 &&
        actualSize <= MAX_UPLOAD_BYTES
      );
    } catch {
      return false;
    }
  }

  async uploadCustomerObject(
    claims: UploadProofClaims,
    buffer: Buffer,
  ): Promise<void> {
    if (
      buffer.length !== claims.size ||
      buffer.length < 1 ||
      buffer.length > MAX_UPLOAD_BYTES ||
      !isAllowedImageContentType(claims.contentType)
    ) {
      throw new Error('Upload does not match the approved metadata');
    }
    const file = await this.getObjectEntityFileReference(claims.objectPath);
    await file.save(buffer, {
      contentType: claims.contentType,
      resumable: false,
      validation: 'crc32c',
    });
  }

  /**
   * Upload bytes to the private object dir and return the normalized
   * `/objects/...` entity path. The raw bucket path is never returned.
   */
  async uploadObjectBuffer({
    buffer,
    contentType,
    keyPrefix,
    extension,
  }: {
    buffer: Buffer;
    contentType: string;
    keyPrefix: string;
    extension: string;
  }): Promise<string> {
    if (!isAllowedImageContentType(contentType)) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    let privateObjectDir = this.getPrivateObjectDir();
    if (privateObjectDir.endsWith('/')) {
      privateObjectDir = privateObjectDir.slice(0, -1);
    }

    const normalizedPrefix = keyPrefix.replace(/^\/+|\/+$/g, '');
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/${normalizedPrefix}/${objectId}.${extension}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    await file.save(buffer, {
      contentType,
      resumable: false,
    });

    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith('/')) {
      entityDir = `${entityDir}/`;
    }
    return `/objects/${fullPath.slice(entityDir.length)}`;
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          'tool and set PRIVATE_OBJECT_DIR env var.',
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: 'PUT',
      ttlSec: 900,
    });
  }

  /**
   * Delete an uploaded customer object (`/objects/uploads/...`). Missing
   * objects are treated as already deleted. Used by tests and cleanup
   * routines to remove orphaned uploads.
   */
  async deleteCustomerUpload(objectPath: string): Promise<void> {
    const file = await this.getObjectEntityFileReference(objectPath);
    await file.delete({ ignoreNotFound: true });
  }

  createCustomerUploadPath(): string {
    return `/objects/uploads/${randomUUID()}`;
  }

  private async getObjectEntityFileReference(objectPath: string): Promise<File> {
    if (!objectPath.startsWith('/objects/uploads/')) {
      throw new ObjectNotFoundError();
    }
    const entityId = objectPath.slice('/objects/'.length);
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith('/')) entityDir = `${entityDir}/`;
    const { bucketName, objectName } = parseObjectPath(`${entityDir}${entityId}`);
    return objectStorageClient.bucket(bucketName).file(objectName);
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith('/objects/')) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split('/');
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join('/');
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith('/')) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith('https://storage.googleapis.com/')) {
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith('/')) {
      objectEntityDir = `${objectEntityDir}/`;
    }

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith('/')) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  const pathParts = path.split('/');
  if (pathParts.length < 3) {
    throw new Error('Invalid path: must contain at least a bucket name');
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join('/');

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: 'GET' | 'PUT' | 'DELETE' | 'HEAD';
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`,
    );
  }

  const { signed_url: signedURL } = await response.json() as { signed_url: string };
  return signedURL;
}
