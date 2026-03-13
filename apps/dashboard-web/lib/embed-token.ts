import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ANY_EMBED_ORIGIN = "*";
const BOOTSTRAP_SCOPE = "bootstrap";
const SESSION_SCOPE = "session";

type EmbedTokenScope = typeof BOOTSTRAP_SCOPE | typeof SESSION_SCOPE;

type EmbedTokenPayload = {
  exp?: number;
  nonceHash?: string;
  origin?: string;
  projectId?: string;
  scope?: EmbedTokenScope;
  sessionId?: string;
  visitorId?: string;
};

function resolveRequestOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    return originHeader;
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return "";
  }

  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function readEnvValue(filePath: string, key: string) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  const source = fs.readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^${key}\\s*=\\s*(.+)$`, "m");
  const match = source.match(pattern);
  if (!match) {
    return "";
  }

  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function hydrateEmbedTokenSecretEnv() {
  if (process.env.EMBED_TOKEN_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) {
    return;
  }

  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "../../.env.local"),
    path.join(process.cwd(), "../../.env")
  ];

  for (const filePath of candidates) {
    for (const key of ["EMBED_TOKEN_SECRET", "AUTH_SECRET", "NEXTAUTH_SECRET"]) {
      const value = readEnvValue(filePath, key);
      if (value && !process.env[key]) {
        process.env[key] = value;
      }
    }

    if (process.env.EMBED_TOKEN_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) {
      return;
    }
  }
}

function getEmbedTokenSecret() {
  hydrateEmbedTokenSecretEnv();
  return process.env.EMBED_TOKEN_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function signEncodedPayload(encodedPayload: string) {
  const secret = getEmbedTokenSecret();
  if (!secret) {
    throw new Error("EMBED_TOKEN_SECRET 또는 AUTH_SECRET 환경변수가 필요합니다.");
  }

  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function encodeTokenPayload(payload: EmbedTokenPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function normalizeRequiredScopes(requiredScope?: EmbedTokenScope | EmbedTokenScope[]) {
  if (!requiredScope) {
    return [];
  }

  return Array.isArray(requiredScope) ? requiredScope : [requiredScope];
}

function hashEmbedSessionNonce(nonce: string) {
  return crypto.createHash("sha256").update(String(nonce || "")).digest("base64url");
}

export function createEmbedToken(input: { projectId: string; origin: string; expiresAt: number }) {
  return encodeTokenPayload({
    projectId: String(input.projectId || "").trim(),
    origin: String(input.origin || "").trim(),
    exp: Number(input.expiresAt),
    scope: BOOTSTRAP_SCOPE
  });
}

export function createEmbedSessionNonce() {
  return crypto.randomBytes(18).toString("base64url");
}

export function createEmbedSessionToken(input: {
  projectId: string;
  origin: string;
  expiresAt: number;
  sessionId?: string;
  sessionNonce: string;
  visitorId?: string;
}) {
  return encodeTokenPayload({
    projectId: String(input.projectId || "").trim(),
    origin: String(input.origin || "").trim(),
    exp: Number(input.expiresAt),
    nonceHash: hashEmbedSessionNonce(input.sessionNonce),
    scope: SESSION_SCOPE,
    sessionId: String(input.sessionId || "").trim() || undefined,
    visitorId: String(input.visitorId || "").trim() || undefined
  });
}

export function verifyEmbedToken(
  token: string,
  expectedProjectId: string,
  expectedOrigin: string,
  options?: {
    expectedSessionId?: string;
    expectedVisitorId?: string;
    requiredScope?: EmbedTokenScope | EmbedTokenScope[];
  }
) {
  const [encodedPayload, signature] = String(token || "").split(".");

  if (!encodedPayload || !signature) {
    return { ok: false as const, error: "유효한 임베드 토큰 형식이 아닙니다." };
  }

  try {
    const expectedSignature = signEncodedPayload(encodedPayload);
    if (!safeEqual(signature, expectedSignature)) {
      return { ok: false as const, error: "임베드 토큰 서명이 올바르지 않습니다." };
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as EmbedTokenPayload;

    if (payload.projectId !== expectedProjectId) {
      return { ok: false as const, error: "임베드 토큰의 프로젝트가 현재 요청과 일치하지 않습니다." };
    }

    if (payload.origin === ANY_EMBED_ORIGIN) {
      return { ok: false as const, error: "origin이 고정되지 않은 예전 임베드 코드입니다. 다시 발급해 주세요." };
    }

    if (payload.origin !== expectedOrigin) {
      return { ok: false as const, error: "임베드 토큰의 origin이 현재 요청과 다릅니다." };
    }

    const requiredScopes = normalizeRequiredScopes(options?.requiredScope);
    const payloadScope = payload.scope || BOOTSTRAP_SCOPE;
    if (requiredScopes.length > 0 && !requiredScopes.includes(payloadScope)) {
      return { ok: false as const, error: "임베드 토큰 scope가 현재 요청과 다릅니다." };
    }

    const expectedSessionId = String(options?.expectedSessionId || "").trim();
    if (expectedSessionId && payloadScope === SESSION_SCOPE && payload.sessionId !== expectedSessionId) {
      return { ok: false as const, error: "임베드 세션의 sessionId가 현재 요청과 다릅니다." };
    }

    const expectedVisitorId = String(options?.expectedVisitorId || "").trim();
    if (expectedVisitorId && payloadScope === SESSION_SCOPE && payload.visitorId && payload.visitorId !== expectedVisitorId) {
      return { ok: false as const, error: "임베드 세션의 visitorId가 현재 요청과 다릅니다." };
    }

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false as const, error: "임베드 토큰이 만료되었습니다." };
    }

    return { ok: true as const, payload };
  } catch {
    return { ok: false as const, error: "임베드 토큰을 검증하지 못했습니다." };
  }
}

export function getEmbedTokenFromRequest(request: Request, body?: Record<string, unknown>) {
  return (
    request.headers.get("x-embed-token") ||
    request.headers.get("x-project-token") ||
    (typeof body?.embedToken === "string" ? body.embedToken : "") ||
    ""
  ).trim();
}

export function getBootstrapTokenFromRequest(request: Request, body?: Record<string, unknown>) {
  return (
    request.headers.get("x-bootstrap-token") ||
    (typeof body?.bootstrapToken === "string" ? body.bootstrapToken : "") ||
    getEmbedTokenFromRequest(request, body)
  ).trim();
}

export function getEmbedSessionFromRequest(request: Request, body?: Record<string, unknown>) {
  return (
    request.headers.get("x-embed-session") ||
    (typeof body?.embedSession === "string" ? body.embedSession : "") ||
    ""
  ).trim();
}

export function getEmbedSessionNonceFromRequest(request: Request, body?: Record<string, unknown>) {
  return (
    request.headers.get("x-embed-session-nonce") ||
    (typeof body?.embedSessionNonce === "string" ? body.embedSessionNonce : "") ||
    ""
  ).trim();
}

export function validateBootstrapRequest(
  request: Request,
  body: Record<string, unknown> | undefined,
  input: { projectId: string; requireSignedEmbed: boolean }
) {
  const token = getBootstrapTokenFromRequest(request, body);

  if (!token) {
    if (input.requireSignedEmbed) {
      return { ok: false as const, error: "A signed bootstrap token is required for this widget." };
    }

    return { ok: true as const, payload: null };
  }

  return verifyEmbedToken(token, input.projectId, resolveRequestOrigin(request), {
    requiredScope: BOOTSTRAP_SCOPE
  });
}

export function validateEmbedSessionRequest(
  request: Request,
  body: Record<string, unknown> | undefined,
  input: {
    projectId: string;
    expectedSessionId?: string;
    expectedVisitorId?: string;
  }
) {
  const sessionToken = getEmbedSessionFromRequest(request, body);
  if (!sessionToken) {
    return { ok: false as const, error: "임베드 세션이 필요합니다." };
  }

  const sessionNonce = getEmbedSessionNonceFromRequest(request, body);
  if (!sessionNonce) {
    return { ok: false as const, error: "임베드 세션 nonce가 필요합니다." };
  }

  const verification = verifyEmbedToken(sessionToken, input.projectId, resolveRequestOrigin(request), {
    requiredScope: SESSION_SCOPE,
    expectedSessionId: input.expectedSessionId,
    expectedVisitorId: input.expectedVisitorId
  });

  if (!verification.ok) {
    return verification;
  }

  if (!verification.payload.nonceHash || !safeEqual(verification.payload.nonceHash, hashEmbedSessionNonce(sessionNonce))) {
    return { ok: false as const, error: "임베드 세션 nonce가 현재 요청과 다릅니다." };
  }

  return verification;
}
