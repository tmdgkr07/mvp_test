export const CURRENT_WIDGET_RUNTIME_ENTRY = "/widget.js";
export const WIDGET_RUNTIME_VERSION = "v1";
export const VERSIONED_WIDGET_RUNTIME_ENTRY = `/${WIDGET_RUNTIME_VERSION}/widget.js`;

export type WidgetRuntimeVariant = "current" | "versioned";

export function trimTrailingSlash(value: string): string {
  return String(value || "").replace(/\/+$/, "");
}

export function buildWidgetAssetUrl(baseUrl: string, variant: WidgetRuntimeVariant = "current"): string {
  const normalizedBaseUrl = trimTrailingSlash(String(baseUrl || "").trim());
  const entry = variant === "versioned" ? VERSIONED_WIDGET_RUNTIME_ENTRY : CURRENT_WIDGET_RUNTIME_ENTRY;

  if (!normalizedBaseUrl) {
    return entry;
  }

  return `${normalizedBaseUrl}${entry}`;
}
