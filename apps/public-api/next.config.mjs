import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sharedHeaders = [
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  }
];

const strictSecurityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https:"
    ].join("; ")
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  }
];

const embedFrameHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors *",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https:"
    ].join("; ")
  },
  ...sharedHeaders
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@mvp-platform/shared"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  async headers() {
    return [
      {
        source: "/((?!embed/widget$).*)",
        headers: [...strictSecurityHeaders, ...sharedHeaders]
      },
      {
        source: "/embed/widget",
        headers: embedFrameHeaders
      },
      {
        source: "/widget-runtime.js",
        headers: [
          ...strictSecurityHeaders,
          ...sharedHeaders,
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800"
          }
        ]
      },
      {
        source: "/v1/widget-runtime.js",
        headers: [
          ...strictSecurityHeaders,
          ...sharedHeaders,
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
