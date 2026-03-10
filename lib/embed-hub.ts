import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_EMBED_SERVICE_URL = "https://embed-sponsor.vercel.app";
const FEEDBACK_LIMIT = 8;
const TOP_PAGES_LIMIT = 8;

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type DashboardUserRow = {
  id: bigint | number;
  provider: string;
  provider_user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

type CreatorProjectRow = {
  id: string;
  owner_user_id: bigint | number;
  name: string;
  website_url: string | null;
  allowed_origins: string[] | null;
  require_signed_embed: boolean;
  moderate_messages: boolean;
  public_messages: boolean;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type OverviewRow = {
  views: bigint | number | null;
  visits: bigint | number | null;
  unique_visitors: bigint | number | null;
  widget_opens: bigint | number | null;
  donation_attempts: bigint | number | null;
  avg_dwell_seconds: number | null;
  donation_success_count: bigint | number | null;
  total_amount: bigint | number | null;
  feedback_count: bigint | number | null;
};

type FeedbackRow = {
  order_id: string;
  supporter_name: string | null;
  message: string;
  campaign: string | null;
  amount: number | bigint;
  currency: string | null;
  message_public_status: string | null;
  approved_at: Date | null;
  created_at: Date;
};

type TopPageRow = {
  host: string | null;
  page_path: string | null;
  campaign: string | null;
  views: bigint | number | null;
  visits: bigint | number | null;
  engaged_seconds: number | null;
};

type DailySeriesRow = {
  day: string;
  views: bigint | number | null;
  visits: bigint | number | null;
  donation_success_count: bigint | number | null;
  total_amount: bigint | number | null;
};

export type EmbedServiceSummary = {
  id: string;
  name: string;
  websiteUrl: string | null;
  websiteOrigin: string | null;
  allowedOrigins: string[];
  requireSignedEmbed: boolean;
  moderateMessages: boolean;
  publicMessages: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmbedHubOverview = {
  views: number;
  visits: number;
  uniqueVisitors: number;
  widgetOpens: number;
  donationAttempts: number;
  avgDwellSeconds: number;
  donationSuccessCount: number;
  totalAmount: number;
  feedbackCount: number;
};

export type EmbedHubFeedback = {
  orderId: string;
  supporterName: string;
  message: string;
  campaign: string;
  amount: number;
  currency: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
};

export type EmbedHubTopPage = {
  host: string | null;
  pagePath: string;
  campaign: string;
  views: number;
  visits: number;
  engagedSeconds: number;
};

export type EmbedHubSeriesPoint = {
  day: string;
  views: number;
  visits: number;
  donationSuccessCount: number;
  totalAmount: number;
};

export type EmbedHubPayload = {
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  serviceUrl: string;
  widgetScriptUrl: string;
  adminUrl: string | null;
  publicMessagesUrl: string | null;
  websiteUrl: string | null;
  websiteOrigin: string | null;
  embedProject: EmbedServiceSummary | null;
  requiresToken: boolean;
  snippet: string | null;
  overview: EmbedHubOverview;
  feedback: EmbedHubFeedback[];
  topPages: EmbedHubTopPage[];
  series: EmbedHubSeriesPoint[];
};

const ZERO_OVERVIEW: EmbedHubOverview = {
  views: 0,
  visits: 0,
  uniqueVisitors: 0,
  widgetOpens: 0,
  donationAttempts: 0,
  avgDwellSeconds: 0,
  donationSuccessCount: 0,
  totalAmount: 0,
  feedbackCount: 0
};

let ensuredSchema = false;

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function toNumber(value: unknown) {
  const converted = Number(value ?? 0);
  return Number.isFinite(converted) ? converted : 0;
}

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseOriginFromUrl(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).origin;
  } catch (error) {
    return null;
  }
}

function sanitizeServiceName(value: unknown) {
  return normalizeText(value).replace(/\s+/g, " ").slice(0, 120);
}

function createProjectId() {
  return `project_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function createDefaultCampaign(project: EmbedServiceSummary) {
  const base = normalizeText(project.websiteOrigin || project.id)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return (base || project.id).slice(0, 48);
}

function getEmbedServiceUrl() {
  const raw =
    process.env.EMBED_SERVICE_URL ||
    process.env.NEXT_PUBLIC_EMBED_SERVICE_URL ||
    process.env.EMBED_WIDGET_BASE_URL ||
    process.env.NEXT_PUBLIC_EMBED_WIDGET_BASE_URL ||
    DEFAULT_EMBED_SERVICE_URL;

  return raw.replace(/\/$/, "");
}

function getProvisionProjectUrl() {
  return `${getEmbedServiceUrl()}/api/self-serve/project`;
}

function getProjectDashboardUrl(projectId: string, days: number) {
  const url = new URL(`${getEmbedServiceUrl()}/api/public/project-dashboard`);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("days", String(days));
  return url.toString();
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function syncProjectToEmbedService(project: EmbedServiceSummary) {
  const response = await fetch(getProvisionProjectUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      projectId: project.id,
      name: project.name,
      websiteUrl: project.websiteUrl
    }),
    cache: "no-store"
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      (payload && payload.error) || "임베드 서비스에 프로젝트를 동기화하지 못했습니다."
    );
  }

  return payload;
}

async function fetchEmbedServiceDashboard(projectId: string, days: number) {
  const response = await fetch(getProjectDashboardUrl(projectId, days), {
    cache: "no-store"
  });
  const payload = await readJsonResponse(response);

  if (!response.ok || !payload) {
    throw new Error(
      (payload && payload.error) || "임베드 서비스 대시보드 데이터를 불러오지 못했습니다."
    );
  }

  return {
    overview: payload.overview ?? ZERO_OVERVIEW,
    feedback: Array.isArray(payload.feedback) ? payload.feedback : [],
    topPages: Array.isArray(payload.pages) ? payload.pages : [],
    series: Array.isArray(payload.series) ? payload.series : []
  };
}

function getAdminEmails() {
  return Array.from(
    new Set(
      String(process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

async function ensureEmbedSchema() {
  if (ensuredSchema) {
    return;
  }

  const schemaStatements = [
    `
      CREATE TABLE IF NOT EXISTS dashboard_users (
        id BIGSERIAL PRIMARY KEY,
        provider VARCHAR(32) NOT NULL DEFAULT 'supabase',
        provider_user_id VARCHAR(191) NOT NULL,
        email VARCHAR(320) NOT NULL,
        display_name VARCHAR(120),
        avatar_url TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'project_admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (provider, provider_user_id)
      )
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS dashboard_users_email_lower_idx
        ON dashboard_users ((LOWER(email)))
    `,
    `
      CREATE TABLE IF NOT EXISTS creator_projects (
        id VARCHAR(80) PRIMARY KEY,
        owner_user_id BIGINT NOT NULL REFERENCES dashboard_users(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        website_url TEXT,
        allowed_origins TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        require_signed_embed BOOLEAN NOT NULL DEFAULT TRUE,
        moderate_messages BOOLEAN NOT NULL DEFAULT FALSE,
        public_messages BOOLEAN NOT NULL DEFAULT TRUE,
        archived_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
    `
      ALTER TABLE creator_projects
      ADD COLUMN IF NOT EXISTS website_url TEXT
    `,
    `
      CREATE INDEX IF NOT EXISTS creator_projects_owner_idx
        ON creator_projects (owner_user_id, created_at DESC)
    `
  ];

  for (const statement of schemaStatements) {
    await prisma.$executeRawUnsafe(statement);
  }

  ensuredSchema = true;
}

export async function ensureDashboardUser(user: SessionUser) {
  await ensureEmbedSchema();

  const provider = "mvp_test";
  const providerUserId = normalizeText(user.id);
  const email = normalizeEmail(user.email);
  const displayName = normalizeText(user.name) || email || providerUserId;
  const avatarUrl = normalizeText(user.image) || null;
  const role = getAdminEmails().includes(email) ? "super_admin" : "project_admin";

  if (!providerUserId || !email) {
    throw new Error("서비스 허브를 사용하려면 로그인한 사용자의 고유 ID와 이메일이 필요합니다.");
  }

  const existingRows = await prisma.$queryRaw<DashboardUserRow[]>(Prisma.sql`
    SELECT *
    FROM dashboard_users
    WHERE (provider = ${provider} AND provider_user_id = ${providerUserId})
       OR LOWER(email) = ${email}
    ORDER BY CASE
      WHEN provider = ${provider} AND provider_user_id = ${providerUserId} THEN 0
      ELSE 1
    END
    LIMIT 1
  `);

  if (existingRows[0]) {
    const updatedRows = await prisma.$queryRaw<DashboardUserRow[]>(Prisma.sql`
      UPDATE dashboard_users
      SET
        provider = ${provider},
        provider_user_id = ${providerUserId},
        email = ${email},
        display_name = ${displayName},
        avatar_url = ${avatarUrl},
        role = ${role},
        updated_at = NOW()
      WHERE id = ${Number(existingRows[0].id)}
      RETURNING *
    `);

    return updatedRows[0];
  }

  const insertedRows = await prisma.$queryRaw<DashboardUserRow[]>(Prisma.sql`
    INSERT INTO dashboard_users (
      provider,
      provider_user_id,
      email,
      display_name,
      avatar_url,
      role
    )
    VALUES (
      ${provider},
      ${providerUserId},
      ${email},
      ${displayName},
      ${avatarUrl},
      ${role}
    )
    RETURNING *
  `);

  return insertedRows[0];
}

function mapEmbedProject(row: CreatorProjectRow): EmbedServiceSummary {
  const websiteUrl = normalizeText(row.website_url) || null;
  const websiteOrigin = parseOriginFromUrl(websiteUrl);

  return {
    id: row.id,
    name: row.name,
    websiteUrl,
    websiteOrigin,
    allowedOrigins: Array.isArray(row.allowed_origins)
      ? row.allowed_origins.map((item) => normalizeText(item)).filter(Boolean)
      : [],
    requireSignedEmbed: Boolean(row.require_signed_embed),
    moderateMessages: Boolean(row.moderate_messages),
    publicMessages: Boolean(row.public_messages),
    createdAt: toIsoString(row.created_at) || new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) || new Date().toISOString()
  };
}

export async function listEmbedProjectsForOwner(ownerUserId: number) {
  await ensureEmbedSchema();

  const rows = await prisma.$queryRaw<CreatorProjectRow[]>(Prisma.sql`
    SELECT *
    FROM creator_projects
    WHERE owner_user_id = ${ownerUserId}
      AND archived_at IS NULL
    ORDER BY updated_at DESC, created_at DESC
  `);

  return rows.map((row) => mapEmbedProject(row));
}

export async function findEmbedProjectForOwner(projectId: string, ownerUserId: number) {
  await ensureEmbedSchema();

  const rows = await prisma.$queryRaw<CreatorProjectRow[]>(Prisma.sql`
    SELECT *
    FROM creator_projects
    WHERE id = ${normalizeText(projectId)}
      AND owner_user_id = ${ownerUserId}
      AND archived_at IS NULL
    LIMIT 1
  `);

  return rows[0] ? mapEmbedProject(rows[0]) : null;
}

export async function createEmbedProjectForOwner(input: {
  ownerUserId: number;
  name: string;
  websiteUrl: string;
}) {
  await ensureEmbedSchema();

  const ownerUserId = Number(input.ownerUserId);
  const name = sanitizeServiceName(input.name);
  const websiteUrl = normalizeText(input.websiteUrl);
  const websiteOrigin = parseOriginFromUrl(websiteUrl);

  if (!Number.isFinite(ownerUserId) || ownerUserId <= 0) {
    throw new Error("서비스 생성에 필요한 사용자 정보가 올바르지 않습니다.");
  }

  if (!name) {
    throw new Error("서비스 이름을 입력해 주세요.");
  }

  if (!websiteOrigin) {
    throw new Error("올바른 사이트 주소를 입력해 주세요.");
  }

  const duplicateRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id
    FROM creator_projects
    WHERE owner_user_id = ${ownerUserId}
      AND archived_at IS NULL
      AND (
        website_url = ${websiteUrl}
        OR ${websiteOrigin} = ANY(COALESCE(allowed_origins, ARRAY[]::text[]))
      )
    LIMIT 1
  `);

  if (duplicateRows[0]) {
    throw new Error("이미 같은 사이트 주소로 만든 임베드 서비스가 있습니다.");
  }

  const rows = await prisma.$queryRaw<CreatorProjectRow[]>(Prisma.sql`
    INSERT INTO creator_projects (
      id,
      owner_user_id,
      name,
      website_url,
      allowed_origins,
      require_signed_embed,
      moderate_messages,
      public_messages
    )
    VALUES (
      ${createProjectId()},
      ${ownerUserId},
      ${name},
      ${websiteUrl},
      ARRAY[${websiteOrigin}]::text[],
      FALSE,
      FALSE,
      TRUE
    )
    RETURNING *
  `);

  const project = mapEmbedProject(rows[0]);

  try {
    await syncProjectToEmbedService(project);
    return project;
  } catch (error) {
    await archiveEmbedProjectForOwner(project.id, ownerUserId);
    throw error;
  }
}

export async function archiveEmbedProjectForOwner(projectId: string, ownerUserId: number) {
  await ensureEmbedSchema();

  const rows = await prisma.$queryRaw<CreatorProjectRow[]>(Prisma.sql`
    UPDATE creator_projects
    SET archived_at = NOW(), updated_at = NOW()
    WHERE id = ${normalizeText(projectId)}
      AND owner_user_id = ${ownerUserId}
      AND archived_at IS NULL
    RETURNING *
  `);

  return rows[0] ? mapEmbedProject(rows[0]) : null;
}

async function getOverview(projectId: string, since: Date) {
  try {
    const rows = await prisma.$queryRaw<OverviewRow[]>(Prisma.sql`
      WITH engagement AS (
        SELECT session_id, SUM(duration_ms) AS session_ms
        FROM analytics_events
        WHERE event_type = 'engagement'
          AND created_at >= ${since}
          AND session_id IS NOT NULL
          AND COALESCE(project_id, 'default') = ${projectId}
        GROUP BY session_id
      )
      SELECT
        (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'view' AND created_at >= ${since} AND COALESCE(project_id, 'default') = ${projectId}) AS views,
        (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE event_type = 'view' AND created_at >= ${since} AND COALESCE(project_id, 'default') = ${projectId}) AS visits,
        (SELECT COUNT(DISTINCT visitor_id) FROM analytics_events WHERE event_type = 'view' AND created_at >= ${since} AND COALESCE(project_id, 'default') = ${projectId}) AS unique_visitors,
        (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'widget_open' AND created_at >= ${since} AND COALESCE(project_id, 'default') = ${projectId}) AS widget_opens,
        (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'donation_submit' AND created_at >= ${since} AND COALESCE(project_id, 'default') = ${projectId}) AS donation_attempts,
        (SELECT COALESCE(ROUND(AVG(session_ms) / 1000.0, 1), 0) FROM engagement) AS avg_dwell_seconds,
        (SELECT COUNT(*) FROM donations WHERE status = 'DONE' AND COALESCE(approved_at, created_at) >= ${since} AND COALESCE(project_id, 'default') = ${projectId}) AS donation_success_count,
        (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status = 'DONE' AND COALESCE(approved_at, created_at) >= ${since} AND COALESCE(project_id, 'default') = ${projectId}) AS total_amount,
        (SELECT COUNT(*) FROM donations WHERE status = 'DONE' AND message IS NOT NULL AND message <> '' AND COALESCE(approved_at, created_at) >= ${since} AND COALESCE(project_id, 'default') = ${projectId}) AS feedback_count
    `);

    const row = rows[0];
    if (!row) {
      return ZERO_OVERVIEW;
    }

    return {
      views: toNumber(row.views),
      visits: toNumber(row.visits),
      uniqueVisitors: toNumber(row.unique_visitors),
      widgetOpens: toNumber(row.widget_opens),
      donationAttempts: toNumber(row.donation_attempts),
      avgDwellSeconds: toNumber(row.avg_dwell_seconds),
      donationSuccessCount: toNumber(row.donation_success_count),
      totalAmount: toNumber(row.total_amount),
      feedbackCount: toNumber(row.feedback_count)
    };
  } catch (error) {
    return ZERO_OVERVIEW;
  }
}

async function getRecentFeedback(projectId: string) {
  try {
    const rows = await prisma.$queryRaw<FeedbackRow[]>(Prisma.sql`
      SELECT
        order_id,
        supporter_name,
        message,
        campaign,
        amount,
        currency,
        COALESCE(message_public_status, CASE WHEN message IS NOT NULL AND message <> '' THEN 'APPROVED' ELSE 'NONE' END) AS message_public_status,
        approved_at,
        created_at
      FROM donations
      WHERE status = 'DONE'
        AND message IS NOT NULL
        AND message <> ''
        AND COALESCE(project_id, 'default') = ${projectId}
      ORDER BY COALESCE(approved_at, created_at) DESC
      LIMIT ${FEEDBACK_LIMIT}
    `);

    return rows.map((row) => ({
      orderId: row.order_id,
      supporterName: normalizeText(row.supporter_name) || "익명 후원자",
      message: normalizeText(row.message),
      campaign: normalizeText(row.campaign) || "default",
      amount: toNumber(row.amount),
      currency: normalizeText(row.currency) || "KRW",
      status: normalizeText(row.message_public_status).toUpperCase() || "NONE",
      approvedAt: toIsoString(row.approved_at),
      createdAt: toIsoString(row.created_at) || new Date().toISOString()
    }));
  } catch (error) {
    return [];
  }
}

async function getTopPages(projectId: string, since: Date) {
  try {
    const rows = await prisma.$queryRaw<TopPageRow[]>(Prisma.sql`
      SELECT
        host,
        COALESCE(page_path, '/') AS page_path,
        COALESCE(campaign, 'default') AS campaign,
        COUNT(*) FILTER (WHERE event_type = 'view') AS views,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view') AS visits,
        COALESCE(ROUND(SUM(duration_ms) FILTER (WHERE event_type = 'engagement') / 1000.0, 1), 0) AS engaged_seconds
      FROM analytics_events
      WHERE created_at >= ${since}
        AND COALESCE(project_id, 'default') = ${projectId}
      GROUP BY host, COALESCE(page_path, '/'), COALESCE(campaign, 'default')
      ORDER BY views DESC, visits DESC
      LIMIT ${TOP_PAGES_LIMIT}
    `);

    return rows.map((row) => ({
      host: normalizeText(row.host) || null,
      pagePath: normalizeText(row.page_path) || "/",
      campaign: normalizeText(row.campaign) || "default",
      views: toNumber(row.views),
      visits: toNumber(row.visits),
      engagedSeconds: toNumber(row.engaged_seconds)
    }));
  } catch (error) {
    return [];
  }
}

async function getDailySeries(projectId: string, since: Date) {
  try {
    const rows = await prisma.$queryRaw<DailySeriesRow[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(date_trunc('day', ${since}::timestamptz), date_trunc('day', NOW()), interval '1 day') AS day
      ),
      analytics AS (
        SELECT
          date_trunc('day', created_at) AS day,
          COUNT(*) FILTER (WHERE event_type = 'view') AS views,
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view') AS visits
        FROM analytics_events
        WHERE created_at >= ${since}
          AND COALESCE(project_id, 'default') = ${projectId}
        GROUP BY 1
      ),
      donations_daily AS (
        SELECT
          date_trunc('day', COALESCE(approved_at, created_at)) AS day,
          COUNT(*) AS donation_success_count,
          COALESCE(SUM(amount), 0) AS total_amount
        FROM donations
        WHERE status = 'DONE'
          AND COALESCE(approved_at, created_at) >= ${since}
          AND COALESCE(project_id, 'default') = ${projectId}
        GROUP BY 1
      )
      SELECT
        to_char(days.day, 'YYYY-MM-DD') AS day,
        COALESCE(analytics.views, 0) AS views,
        COALESCE(analytics.visits, 0) AS visits,
        COALESCE(donations_daily.donation_success_count, 0) AS donation_success_count,
        COALESCE(donations_daily.total_amount, 0) AS total_amount
      FROM days
      LEFT JOIN analytics ON analytics.day = days.day
      LEFT JOIN donations_daily ON donations_daily.day = days.day
      ORDER BY days.day ASC
    `);

    return rows.map((row) => ({
      day: row.day,
      views: toNumber(row.views),
      visits: toNumber(row.visits),
      donationSuccessCount: toNumber(row.donation_success_count),
      totalAmount: toNumber(row.total_amount)
    }));
  } catch (error) {
    return [];
  }
}

export async function getEmbedHubPayload(project: EmbedServiceSummary, days = 30): Promise<EmbedHubPayload> {
  const serviceUrl = getEmbedServiceUrl();
  const widgetScriptUrl = `${serviceUrl}/widget.js`;
  const adminUrl = `${serviceUrl}/admin?projectId=${encodeURIComponent(project.id)}`;
  const publicMessagesUrl = `${serviceUrl}/messages?projectId=${encodeURIComponent(project.id)}`;
  const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? days : 30;
  await syncProjectToEmbedService(project);
  const { overview, feedback, topPages, series } = await fetchEmbedServiceDashboard(project.id, safeDays);

  const requiresToken = Boolean(project.requireSignedEmbed);
  const snippet = requiresToken
    ? null
    : [
        "<script",
        `  src="${widgetScriptUrl}"`,
        "  async",
        `  data-project-id="${project.id}"`,
        `  data-campaign="${createDefaultCampaign(project)}"`,
        "></script>"
      ].join("\n");

  return {
    selectedProjectId: project.id,
    selectedProjectName: project.name,
    serviceUrl,
    widgetScriptUrl,
    adminUrl,
    publicMessagesUrl,
    websiteUrl: project.websiteUrl,
    websiteOrigin: project.websiteOrigin,
    embedProject: project,
    requiresToken,
    snippet,
    overview,
    feedback,
    topPages,
    series
  };
}
