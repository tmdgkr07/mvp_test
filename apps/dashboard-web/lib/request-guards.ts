type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __babjuseyoRateLimitStore: Map<string, RateLimitEntry> | undefined;
  // eslint-disable-next-line no-var
  var __babjuseyoRateLimitLastPruneAt: number | undefined;
}

const rateLimitStore = globalThis.__babjuseyoRateLimitStore || new Map<string, RateLimitEntry>();

if (!globalThis.__babjuseyoRateLimitStore) {
  globalThis.__babjuseyoRateLimitStore = rateLimitStore;
}

function pruneExpiredEntries(now: number) {
  const lastPruneAt = globalThis.__babjuseyoRateLimitLastPruneAt || 0;
  if (now - lastPruneAt < 60_000 && rateLimitStore.size < 500) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  globalThis.__babjuseyoRateLimitLastPruneAt = now;
}

function sanitizeKeyPart(value: unknown, maxLength = 120) {
  const text = String(value || "").trim();
  if (!text) {
    return "-";
  }

  return text.replace(/\s+/g, " ").slice(0, maxLength);
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "";
  return sanitizeKeyPart(candidate || "unknown", 80);
}

export function buildRateLimitKey(...parts: unknown[]) {
  return parts.map((part) => sanitizeKeyPart(part)).join(":");
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function resolveExpectedOrigins(request: Request) {
  const expected = new Set<string>();
  const requestUrlOrigin = normalizeOrigin(request.url);
  if (requestUrlOrigin) {
    expected.add(requestUrlOrigin);
  }

  const host = String(request.headers.get("x-forwarded-host") || request.headers.get("host") || "").trim();
  const forwardedProto = String(request.headers.get("x-forwarded-proto") || "").trim();

  if (host) {
    const fallbackProtocol = requestUrlOrigin ? new URL(requestUrlOrigin).protocol.replace(":", "") : "http";
    const candidateOrigin = normalizeOrigin(`${forwardedProto || fallbackProtocol}://${host}`);
    if (candidateOrigin) {
      expected.add(candidateOrigin);
    }
  }

  return expected;
}

export function validateTrustedAppMutation(request: Request) {
  const expectedOrigins = resolveExpectedOrigins(request);
  const originHeader = normalizeOrigin(request.headers.get("origin") || "");
  const refererOrigin = normalizeOrigin(request.headers.get("referer") || "");
  const fetchSite = String(request.headers.get("sec-fetch-site") || "").trim().toLowerCase();

  if (!originHeader && !refererOrigin) {
    return { ok: false as const, error: "Origin or Referer is required for authenticated mutations." };
  }

  if (originHeader && !expectedOrigins.has(originHeader)) {
    return { ok: false as const, error: "Cross-origin mutations are not allowed." };
  }

  if (!originHeader && refererOrigin && !expectedOrigins.has(refererOrigin)) {
    return { ok: false as const, error: "Cross-origin referers are not allowed." };
  }

  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return { ok: false as const, error: "Cross-site browser requests are blocked." };
  }

  return { ok: true as const };
}

export function checkRateLimit(input: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  pruneExpiredEntries(now);

  const current = rateLimitStore.get(input.key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs
    });

    return {
      ok: true as const,
      remaining: Math.max(input.limit - 1, 0),
      retryAfterSeconds: Math.ceil(input.windowMs / 1000)
    };
  }

  if (current.count >= input.limit) {
    return {
      ok: false as const,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1)
    };
  }

  current.count += 1;
  rateLimitStore.set(input.key, current);

  return {
    ok: true as const,
    remaining: Math.max(input.limit - current.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1)
  };
}
