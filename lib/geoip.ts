/**
 * Soft geo lookup for login/registration audit.
 * Never blocks auth: short timeout, fail soft.
 */

import type { GeoInfo } from "./auth/types";

const GEO_TIMEOUT_MS = 2200;

const DATACENTER_KEYWORDS = [
  "digitalocean",
  "hetzner",
  "amazon",
  "aws",
  "google cloud",
  "google llc",
  "microsoft",
  "azure",
  "cloudflare",
  "ovh",
  "linode",
  "akamai",
  "vultr",
  "contabo",
  "scaleway",
  "oracle cloud",
  "alibaba",
  "hostinger",
  "choopa",
  "leaseweb",
  "m247",
  "datacamp",
  "psychz",
  "quadranet",
  "colocrossing",
  "hosting",
  "vps",
  "datacenter",
  "data center",
  "cdn",
];

export function detectDatacenter(org: string | null | undefined): boolean {
  if (!org) return false;
  const lower = org.toLowerCase();
  return DATACENTER_KEYWORDS.some((kw) => lower.includes(kw));
}

function isLoopbackOrPrivate(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (v === "127.0.0.1" || v === "::1" || v === "localhost") return true;
  if (v.startsWith("10.") || v.startsWith("192.168.") || v.startsWith("127.")) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
  return false;
}

/** Lookup geo via ipapi.co JSON (HTTPS). Returns null on any failure. */
export async function lookupGeo(ip: string): Promise<GeoInfo | null> {
  const trimmed = ip?.trim();
  if (!trimmed || isLoopbackOrPrivate(trimmed)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const url = `https://ipapi.co/${encodeURIComponent(trimmed)}/json/`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "DuneCraft/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      error?: boolean;
      country_name?: string;
      country?: string;
      city?: string;
      org?: string;
      asn?: string;
    };
    if (data.error) return null;
    const org = (data.org || data.asn || "").trim() || undefined;
    const country =
      (data.country_name || data.country || "").trim() || undefined;
    const city = (data.city || "").trim() || undefined;
    if (!country && !city && !org) return null;
    return {
      country,
      city,
      org,
      isDatacenter: detectDatacenter(org),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
