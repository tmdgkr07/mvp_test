import crypto from "node:crypto";

export function sanitizeText(value: unknown, maxLength: number, fallback = ""): string {
  const text = String(value == null ? fallback : value)
    .trim()
    .replace(/\s+/g, " ");

  if (!text) {
    return String(fallback).slice(0, maxLength);
  }

  return text.slice(0, maxLength);
}

export function parseAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : Number.NaN;
  }

  const normalized = String(value ?? "")
    .replace(/[^0-9.-]/g, "")
    .trim();
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function trimBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

function buildLocalServiceBaseUrl(request: Request, port: number) {
  const url = new URL(request.url);
  if (!isLocalDevelopmentHostname(url.hostname)) {
    return "";
  }

  url.port = String(port);
  return trimBaseUrl(url.origin);
}

function isLocalDevelopmentHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

function assertAllowedOriginProtocol(url: URL) {
  if (url.protocol === "https:") {
    return;
  }

  if (url.protocol === "http:" && isLocalDevelopmentHostname(url.hostname)) {
    return;
  }

  throw new Error("Only https origins are allowed outside local development.");
}

export function buildAppBaseUrl(request: Request): string {
  if (process.env.PUBLIC_SITE_URL) {
    return trimBaseUrl(process.env.PUBLIC_SITE_URL);
  }

  return new URL(request.url).origin;
}

export function buildEmbedPublicUrl(request: Request): string {
  if (process.env.EMBED_PUBLIC_URL) {
    return trimBaseUrl(process.env.EMBED_PUBLIC_URL);
  }

  const localWidgetBaseUrl = buildLocalServiceBaseUrl(request, 3100);
  if (localWidgetBaseUrl) {
    return localWidgetBaseUrl;
  }

  return buildAppBaseUrl(request);
}

export function buildEmbedApiBaseUrl(request: Request): string {
  if (process.env.PUBLIC_API_BASE_URL) {
    return trimBaseUrl(process.env.PUBLIC_API_BASE_URL);
  }

  if (process.env.EMBED_API_BASE_URL) {
    return trimBaseUrl(process.env.EMBED_API_BASE_URL);
  }

  const localApiBaseUrl = buildLocalServiceBaseUrl(request, 3200);
  if (localApiBaseUrl) {
    return localApiBaseUrl;
  }

  return buildAppBaseUrl(request);
}

export const buildBaseUrl = buildAppBaseUrl;

export function createOrderId(): string {
  return `don_${crypto.randomUUID().replace(/-/g, "_")}`;
}

export function createIdempotencyKey(prefix = "req"): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`);
  }
  return value;
}

export function normalizeOrigin(value: string): string {
  const target = String(value || "").trim();
  if (!target) {
    throw new Error("origin 값이 비어 있습니다.");
  }

  try {
    const url = new URL(target);
    assertAllowedOriginProtocol(url);
    return url.origin;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("origin 값이 올바른 URL이 아닙니다.");
  }
}

export function normalizeHttpUrl(value: string): string {
  const target = String(value || "").trim();
  if (!target) {
    throw new Error("URL 값이 비어 있습니다.");
  }

  const url = new URL(target);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("http/https URL만 허용합니다.");
  }

  assertAllowedOriginProtocol(url);
  return url.toString();
}

export function normalizeOptionalOrigin(value: unknown): string {
  const target = String(value || "").trim();
  if (!target) {
    return "";
  }

  try {
    return normalizeOrigin(target);
  } catch {
    return "";
  }
}

export function sanitizePageUrlForOrigin(value: unknown, expectedOrigin: string): string {
  const target = String(value || "").trim();
  if (!target || !expectedOrigin) {
    return "";
  }

  try {
    const url = new URL(normalizeHttpUrl(target));
    return url.origin === expectedOrigin ? url.toString() : "";
  } catch {
    return "";
  }
}

export function resolveSafeReturnUrl(pageUrl?: string | null, originUrl?: string | null) {
  const normalizedOrigin = normalizeOptionalOrigin(originUrl);
  const normalizedPageUrl = sanitizePageUrlForOrigin(pageUrl || "", normalizedOrigin);

  return normalizedPageUrl || normalizedOrigin;
}

export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
