import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Project } from "@/lib/types";

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
  allowed_origins: string[] | null;
  require_signed_embed: boolean;
  moderate_messages: boolean;
  public_messages: boolean;
  archived_at: Date | null;
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

export type EmbedServiceProject = {
  id: string;
  name: string;
  allowedOrigins: string[];
  requireSignedEmbed: boolean;
  moderateMessages: boolean;
  publicMessages: boolean;
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
  websiteOrigin: string | null;
  embedProject: EmbedServiceProject | null;
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

function getEmbedServiceUrl() {
  const raw =
    process.env.EMBED_SERVICE_URL ||
    process.env.NEXT_PUBLIC_EMBED_SERVICE_URL ||
    process.env.EMBED_WIDGET_BASE_URL ||
    process.env.NEXT_PUBLIC_EMBED_WIDGET_BASE_URL ||
    DEFAULT_EMBED_SERVICE_URL;

  return raw.replace(/\/$/, "");
}

function getWebsiteOrigin(project: Project) {
  try {
    return new URL(project.websiteUrl).origin;
  } catch (error) {
    return null;
  }
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

  await prisma.$executeRawUnsafe(`
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
    );

    CREATE UNIQUE INDEX IF NOT EXISTS dashboard_users_email_lower_idx
      ON dashboard_users ((LOWER(email)));

    CREATE TABLE IF NOT EXISTS creator_projects (
      id VARCHAR(80) PRIMARY KEY,
      owner_user_id BIGINT NOT NULL REFERENCES dashboard_users(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      allowed_origins TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      require_signed_embed BOOLEAN NOT NULL DEFAULT TRUE,
      moderate_messages BOOLEAN NOT NULL DEFAULT FALSE,
      public_messages BOOLEAN NOT NULL DEFAULT TRUE,
      archived_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS creator_projects_owner_idx
      ON creator_projects (owner_user_id, created_at DESC);
  `);

  ensuredSchema = true;
}

async function ensureDashboardUser(user: SessionUser) {
  await ensureEmbedSchema();

  const provider = "mvp_test";
  const providerUserId = normalizeText(user.id);
  const email = normalizeEmail(user.email);
  const displayName = normalizeText(user.name) || email || providerUserId;
  const avatarUrl = normalizeText(user.image) || null;
  const role = getAdminEmails().includes(email) ? "super_admin" : "project_admin";

  if (!providerUserId || !email) {
    throw new Error("임베드 연동에는 로그인한 사용자의 고유 ID와 이메일이 필요합니다.");
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

async function ensureCreatorProject(project: Project, ownerUser: DashboardUserRow) {
  const websiteOrigin = getWebsiteOrigin(project);
  const allowedOriginsSql = websiteOrigin
    ? Prisma.sql`ARRAY[${websiteOrigin}]::text[]`
    : Prisma.sql`ARRAY[]::text[]`;

  const rows = await prisma.$queryRaw<CreatorProjectRow[]>(Prisma.sql`
    INSERT INTO creator_projects (
      id,
      owner_user_id,
      name,
      allowed_origins,
      require_signed_embed,
      moderate_messages,
      public_messages,
      archived_at
    )
    VALUES (
      ${project.id},
      ${Number(ownerUser.id)},
      ${project.name},
      ${allowedOriginsSql},
      FALSE,
      FALSE,
      TRUE,
      NULL
    )
    ON CONFLICT (id)
    DO UPDATE SET
      owner_user_id = EXCLUDED.owner_user_id,
      name = EXCLUDED.name,
      allowed_origins = CASE
        WHEN cardinality(EXCLUDED.allowed_origins) = 0 THEN creator_projects.allowed_origins
        ELSE ARRAY(
          SELECT DISTINCT origin_value
          FROM unnest(COALESCE(creator_projects.allowed_origins, ARRAY[]::text[]) || EXCLUDED.allowed_origins) AS origin_value
          WHERE origin_value IS NOT NULL AND origin_value <> ''
        )
      END,
      archived_at = NULL,
      updated_at = NOW()
    RETURNING *
  `);

  return rows[0];
}

function mapEmbedProject(row: CreatorProjectRow | null): EmbedServiceProject | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    allowedOrigins: Array.isArray(row.allowed_origins)
      ? row.allowed_origins.map((item) => normalizeText(item)).filter(Boolean)
      : [],
    requireSignedEmbed: Boolean(row.require_signed_embed),
    moderateMessages: Boolean(row.moderate_messages),
    publicMessages: Boolean(row.public_messages)
  };
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

export async function getEmbedHubPayload(project: Project, user: SessionUser, days = 30): Promise<EmbedHubPayload> {
  const ownerUser = await ensureDashboardUser(user);
  const creatorProject = await ensureCreatorProject(project, ownerUser);
  const embedProject = mapEmbedProject(creatorProject);
  const serviceUrl = getEmbedServiceUrl();
  const widgetScriptUrl = `${serviceUrl}/widget.js`;
  const adminUrl = `${serviceUrl}/admin?projectId=${encodeURIComponent(project.id)}`;
  const publicMessagesUrl = `${serviceUrl}/messages?projectId=${encodeURIComponent(project.id)}`;
  const websiteOrigin = getWebsiteOrigin(project);
  const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? days : 30;
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
  const [overview, feedback, topPages, series] = await Promise.all([
    getOverview(project.id, since),
    getRecentFeedback(project.id),
    getTopPages(project.id, since),
    getDailySeries(project.id, since)
  ]);

  const requiresToken = Boolean(embedProject?.requireSignedEmbed);
  const snippet = requiresToken
    ? null
    : [
        "<script",
        `  src="${widgetScriptUrl}"`,
        "  async",
        `  data-project-id="${project.id}"`,
        `  data-campaign="${project.slug}"`,
        "></script>"
      ].join("\n");

  return {
    selectedProjectId: project.id,
    selectedProjectName: project.name,
    serviceUrl,
    widgetScriptUrl,
    adminUrl,
    publicMessagesUrl,
    websiteOrigin,
    embedProject,
    requiresToken,
    snippet,
    overview,
    feedback,
    topPages,
    series
  };
}
