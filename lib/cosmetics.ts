import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export type CosmeticKind = "skin" | "cape";

const MAX_BYTES = 512 * 1024;
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const SKIN_SIZES = new Set([
  "64x32",
  "64x64",
  "128x64",
  "128x128",
  "256x128",
  "256x256",
]);

const CAPE_SIZES = new Set([
  "22x17",
  "64x32",
  "128x64",
  "256x128",
  "512x256",
  "1024x512",
]);

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function isCosmeticKind(value: unknown): value is CosmeticKind {
  return value === "skin" || value === "cape";
}

export function readPngSize(
  buf: Buffer,
): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  for (let i = 0; i < PNG_SIG.length; i += 1) {
    if (buf[i] !== PNG_SIG[i]) return null;
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height || width > 4096 || height > 4096) return null;
  return { width, height };
}

export function validateCosmeticPng(
  buf: Buffer,
  kind: CosmeticKind,
): { ok: true; width: number; height: number } | { ok: false; error: string } {
  if (buf.length > MAX_BYTES) return { ok: false, error: "file_too_large" };
  const size = readPngSize(buf);
  if (!size) return { ok: false, error: "not_png" };
  const key = `${size.width}x${size.height}`;
  const allowed = kind === "skin" ? SKIN_SIZES : CAPE_SIZES;
  if (!allowed.has(key)) return { ok: false, error: "bad_dimensions" };
  return { ok: true, ...size };
}

function blobPath(username: string, kind: CosmeticKind): string {
  const safe = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return `dunecraft/cosmetics/${safe}/${kind}.png`;
}

function localPath(username: string, kind: CosmeticKind): string {
  const safe = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return path.join(process.cwd(), "data", "cosmetics", `${safe}-${kind}.png`);
}

export async function saveCosmeticFile(
  username: string,
  kind: CosmeticKind,
  buf: Buffer,
): Promise<string> {
  if (hasBlob()) {
    const uploaded = await put(blobPath(username, kind), buf, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/png",
      cacheControlMaxAge: 0,
    });
    const sep = uploaded.url.includes("?") ? "&" : "?";
    return `${uploaded.url}${sep}v=${Date.now()}`;
  }
  const dest = localPath(username, kind);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return `/api/auth/cosmetics/file?user=${encodeURIComponent(username)}&kind=${kind}&v=${Date.now()}`;
}

export async function readLocalCosmetic(
  username: string,
  kind: CosmeticKind,
): Promise<Buffer | null> {
  try {
    return await fs.readFile(localPath(username, kind));
  } catch {
    return null;
  }
}
