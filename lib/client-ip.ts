/**
 * Extract client IP from Vercel / proxy headers.
 * Prefer first public address in x-forwarded-for.
 */

function isPrivateOrLocal(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (!v || v === "unknown" || v === "::1" || v === "localhost") return true;
  if (v.startsWith("127.") || v.startsWith("10.") || v.startsWith("192.168.")) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:")) return true;
  if (v.startsWith("::ffff:")) {
    return isPrivateOrLocal(v.slice(7));
  }
  return false;
}

function normalizeIp(raw: string): string {
  let ip = raw.trim();
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) {
    ip = ip.replace(/:\d+$/, "");
  }
  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  }
  if (ip.toLowerCase().startsWith("::ffff:")) {
    ip = ip.slice(7);
  }
  return ip;
}

/** Resolve client IP from request headers (never throws). */
export function getClientIp(request: Request): string | null {
  const headers = request.headers;
  const candidates: string[] = [];

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    for (const part of xff.split(",")) {
      const ip = normalizeIp(part);
      if (ip) candidates.push(ip);
    }
  }

  for (const name of [
    "x-real-ip",
    "cf-connecting-ip",
    "true-client-ip",
    "x-client-ip",
  ] as const) {
    const v = headers.get(name);
    if (v) candidates.push(normalizeIp(v));
  }

  const publicIp = candidates.find((ip) => ip && !isPrivateOrLocal(ip));
  if (publicIp) return publicIp;
  return candidates.find((ip) => Boolean(ip)) ?? null;
}

/** Derive IPv4 /24 subnet string, e.g. 203.0.113.0/24. */
export function ipv4Subnet24(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip.trim());
  if (!m) return null;
  const octets = [m[1], m[2], m[3], m[4]].map((n) => Number(n));
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
}

export function getUserAgent(request: Request): string | undefined {
  const ua = request.headers.get("user-agent")?.trim();
  if (!ua) return undefined;
  return ua.length > 400 ? ua.slice(0, 400) : ua;
}
