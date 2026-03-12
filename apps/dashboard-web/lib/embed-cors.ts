const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8"
};

const baseCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Bootstrap-Token, X-Embed-Session, X-Embed-Token, X-Project-Token"
};

export function corsHeadersForOrigin(origin: string) {
  if (!origin || origin === "null") {
    return { ...baseCorsHeaders };
  }

  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin"
  };
}

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...baseCorsHeaders,
      ...jsonHeaders,
      ...(headers || {})
    }
  });
}

export function noContent(headers?: Record<string, string>) {
  return new Response(null, {
    status: 204,
    headers: {
      ...baseCorsHeaders,
      ...(headers || {})
    }
  });
}
