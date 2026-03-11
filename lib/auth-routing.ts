const LOGIN_NOTICE_MESSAGES = {
  login_required: "로그인 후 이용해 주세요"
} as const;

export type LoginNoticeKey = keyof typeof LOGIN_NOTICE_MESSAGES;

export const DEFAULT_AUTH_CALLBACK_URL = "/dashboard";

export function sanitizeCallbackUrl(value?: string | null, fallback = DEFAULT_AUTH_CALLBACK_URL) {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function buildPathWithSearch(pathname: string, searchParams?: { toString(): string } | null) {
  const query = searchParams?.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildLoginHref(callbackUrl: string, notice: LoginNoticeKey = "login_required") {
  const params = new URLSearchParams({
    callbackUrl: sanitizeCallbackUrl(callbackUrl, "/"),
    message: notice
  });

  return `/login?${params.toString()}`;
}

export function resolveLoginMessage(message?: string | null) {
  if (!message) return undefined;
  return LOGIN_NOTICE_MESSAGES[message as LoginNoticeKey];
}
