import { del, put } from "@vercel/blob";
import { PROSPECTUS_ATTACHMENT_MAX_BYTES } from "./prospectus-schemas";

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export type BlobUploadResult = {
  url: string;
  pathname: string;
};

export async function uploadProspectusAttachment(
  prospectusPublicId: string,
  filename: string,
  body: Buffer,
  contentType: string,
): Promise<BlobUploadResult> {
  if (!isBlobStorageConfigured()) {
    throw new BlobStorageError("BLOB_READ_WRITE_TOKEN is not configured");
  }

  if (body.byteLength > PROSPECTUS_ATTACHMENT_MAX_BYTES) {
    throw new BlobStorageError("File exceeds 10 MB limit");
  }

  const pathname = `prospectus/${prospectusPublicId}/${Date.now()}-${sanitizeFilename(filename)}`;

  const blob = await put(pathname, body, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType,
  });

  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteProspectusAttachment(pathname: string): Promise<void> {
  if (!isBlobStorageConfigured()) {
    throw new BlobStorageError("BLOB_READ_WRITE_TOKEN is not configured");
  }

  await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export class BlobStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlobStorageError";
  }
}
