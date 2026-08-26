import AppError from "./appError.js";



// IP ranges that must NEVER be reachable from a user-submitted URL.
// These cover:
//   - loopback (127.0.0.0/8, ::1)
//   - private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
//   - link-local (169.254.0.0/16, fe80::/10) — includes AWS / GCP
//     metadata endpoints like 169.254.169.254.
//   - unspecified (0.0.0.0, ::)
//   - multicast and broadcast
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "[::]",
]);

// Quickly check whether an IPv4 string falls into a reserved/private range.
// We don't need full RFC correctness — we just need to block the dangerous
// ranges. Anything that doesn't match any rule is considered public.
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return true; 

  const octets = parts.map((p) => {
    const n = Number(p);
    return Number.isFinite(n) && n >= 0 && n <= 255 ? n : -1;
  });
  if (octets.some((n) => n < 0)) return true;

  const [a, b] = octets;

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 127.0.0.0/8 loopback
  if (a === 127) return true;
  // 169.254.0.0/16 link-local (cloud metadata!)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 unspecified
  if (a === 0) return true;

  return false;
}

// Returns true if the given hostname points to an IPv6 address in a reserved
// range. We only need to block the obvious cases.
function isPrivateIPv6(hostname: string): boolean {
  // Strip surrounding brackets Node may have included when wrapping an
  // IPv6 literal.
  const h = hostname.replace(/^\[|\]$/g, "");
  // Anything starting with `fc` or `fd` is unique-local (private).
  if (/^f[cd]/i.test(h)) return true;
  // fe80::/10 link-local.
  if (/^fe[89ab]/i.test(h)) return true;
  // ::1 loopback.
  if (h === "::1") return true;
  // :: unspecified.
  if (h === "::") return true;
  return false;
}


export function validatePublicUrl(rawUrl: string): URL {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    throw new AppError("Please provide a URL", 400);
  }

  let formattedUrl = rawUrl.trim();

 
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(formattedUrl);
  } catch {
    throw new AppError("Invalid URL format", 400);
  }

  // Only HTTP/HTTPS are allowed — blocks javascript:, file:, data:, etc.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError("Only http and https URLs are allowed", 400);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block obvious localhost-style names.
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new AppError("This URL is not allowed for security reasons", 400);
  }

  // If the hostname looks like a literal IP, block private/reserved ranges.
  if (isPrivateIPv6(hostname)) {
    throw new AppError("This URL is not allowed for security reasons", 400);
  }

  // IPv4? (digits and dots only)
  if (/^\d+(\.\d+){3}$/.test(hostname) && isPrivateIPv4(hostname)) {
    throw new AppError("This URL is not allowed for security reasons", 400);
  }

  return parsed;
}