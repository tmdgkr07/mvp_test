import { randomUUID } from "crypto";

export function createSlug(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || `project-${randomUUID().slice(0, 8)}`;
}

export function toISOStringSafe(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function parseMetadata(input: unknown): Record<string, string | number | boolean | null> | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const result: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      result[key] = value;
    }
  }

  return Object.keys(result).length ? result : undefined;
}
