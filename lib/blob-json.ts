import {
  BlobNotFoundError,
  BlobPreconditionFailedError,
  get,
  put,
} from "@vercel/blob";

/**
 * Public blobs are cached at the edge for at least a minute.
 * `?t=` on the CDN URL does not bypass that. `get(..., { useCache: false })` reads origin.
 */
export async function readPublicJson<T>(
  pathname: string,
): Promise<{ data: T | null; etag: string | null }> {
  try {
    const result = await get(pathname, { access: "public", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return { data: null, etag: null };
    }
    const text = await new Response(result.stream).text();
    return {
      data: JSON.parse(text) as T,
      etag: result.blob.etag || null,
    };
  } catch (err) {
    if (err instanceof BlobNotFoundError) return { data: null, etag: null };
    throw err;
  }
}

export async function writePublicJson(
  pathname: string,
  data: unknown,
): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export function isBlobConflict(err: unknown): boolean {
  return err instanceof BlobPreconditionFailedError;
}
