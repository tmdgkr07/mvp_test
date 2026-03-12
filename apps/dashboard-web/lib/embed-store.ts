import { DonationStatus, MessagePublicStatus } from "@prisma/client";
import { buildWidgetAssetUrl } from "@mvp-platform/shared/runtime";
import { prisma as db } from "@/lib/prisma";
import { createEmbedToken } from "@/lib/embed-token";
import { buildEmbedApiBaseUrl, buildEmbedPublicUrl, createOrderId, escapeHtmlAttribute, normalizeOrigin, sanitizeText } from "@/lib/embed-utils";

const DEFAULT_PRESET_AMOUNTS = [5000, 10000, 30000];
const DEFAULT_MIN_AMOUNT = 1000;
const DEFAULT_MAX_AMOUNT = 500000;

function getDefaultDescription(project: { name: string; tagline: string }) {
  return project.tagline?.trim() || `${project.name}에 힘이 되는 후원과 피드백을 받아보세요.`;
}

function buildDefaultSettings(project: { id: string; name: string; tagline: string }) {
  return {
    projectId: project.id,
    creatorName: project.name,
    headline: `${project.name}를 응원해주세요`,
    description: getDefaultDescription(project),
    buttonText: "후원하기",
    checkoutText: "결제하기",
    theme: "sunset",
    currency: "KRW",
    presetAmounts: DEFAULT_PRESET_AMOUNTS,
    minAmount: DEFAULT_MIN_AMOUNT,
    maxAmount: DEFAULT_MAX_AMOUNT,
    campaign: "default",
    paymentMethod: "CARD",
    note: "남긴 메시지는 제작자가 서비스 허브에서만 확인할 수 있습니다.",
    requireSignedEmbed: true,
    moderateMessages: false,
    publicMessages: false
  };
}

export function resolveRequestOrigin(request: Request) {
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
  } catch (error) {
    return "";
  }
}

export function isOriginAllowed(allowedOrigins: string[], origin: string) {
  if (!allowedOrigins.length) {
    return false;
  }

  if (allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

export async function getProjectEmbedState(projectId: string) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      tagline: true,
      websiteUrl: true,
      ownerId: true
    }
  });

  if (!project) {
    return null;
  }

  const settings = await db.embedProjectSettings.upsert({
    where: { projectId: project.id },
    update: {},
    create: buildDefaultSettings(project),
    include: {
      allowedOrigins: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return {
    project,
    settings,
    allowedOrigins: settings.allowedOrigins.map((item) => item.origin)
  };
}

export async function addAllowedOrigin(projectId: string, origin: string) {
  const state = await getProjectEmbedState(projectId);
  if (!state) {
    return null;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  await db.embedAllowedOrigin.upsert({
    where: {
      settingsId_origin: {
        settingsId: state.settings.id,
        origin: normalizedOrigin
      }
    },
    update: {},
    create: {
      settingsId: state.settings.id,
      origin: normalizedOrigin
    }
  });

  return getProjectEmbedState(projectId);
}

export async function removeAllowedOrigin(projectId: string, origin: string) {
  const state = await getProjectEmbedState(projectId);
  if (!state) {
    return null;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  await db.embedAllowedOrigin.deleteMany({
    where: {
      settingsId: state.settings.id,
      origin: normalizedOrigin
    }
  });

  return getProjectEmbedState(projectId);
}

function buildSnippet(widgetBaseUrl: string, apiBaseUrl: string, input: Awaited<ReturnType<typeof getProjectEmbedState>>, token: string) {
  if (!input) {
    throw new Error("임베드 스니펫을 만들 프로젝트를 찾지 못했습니다.");
  }

  const attrs: Array<[string, string]> = [
    ["data-project-id", input.project.id],
    ["data-bootstrap-token", token],
    ["data-embed-token", token],
    ["data-bootstrap-path", `${apiBaseUrl}/api/embed/bootstrap`],
    ["data-api-path", `${apiBaseUrl}/api/create-payment`],
    ["data-tracking-path", `${apiBaseUrl}/api/track`],
    ["data-creator", input.settings.creatorName],
    ["data-headline", input.settings.headline],
    ["data-description", input.settings.description],
    ["data-button-text", input.settings.buttonText],
    ["data-checkout-text", input.settings.checkoutText],
    ["data-theme", input.settings.theme],
    ["data-currency", input.settings.currency],
    ["data-presets", input.settings.presetAmounts.join(",")],
    ["data-min-amount", String(input.settings.minAmount)],
    ["data-max-amount", String(input.settings.maxAmount)],
    ["data-campaign", input.settings.campaign],
    ["data-method", input.settings.paymentMethod],
    ["data-note", input.settings.note || ""]
  ];

  if (input.settings.accentColor) {
    attrs.push(["data-accent", input.settings.accentColor]);
  }

  const serializedAttrs = attrs
    .filter(([, value]) => value)
    .map(([key, value]) => `  ${key}="${escapeHtmlAttribute(value)}"`);

  return [
    "<script",
    `  src="${buildWidgetAssetUrl(widgetBaseUrl)}"`,
    "  async",
    ...serializedAttrs,
    "></script>"
  ].join("\n");
}

export async function issueEmbedSnippet(input: { projectId: string; origin: string; request: Request }) {
  const normalizedOrigin = normalizeOrigin(String(input.origin || "").trim());
  const state = await addAllowedOrigin(input.projectId, normalizedOrigin);
  if (!state) {
    throw new Error("임베드 설정을 만들 프로젝트를 찾지 못했습니다.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
  const token = createEmbedToken({
    projectId: state.project.id,
    origin: normalizedOrigin,
    expiresAt
  });

  return {
    projectId: state.project.id,
    origin: normalizedOrigin,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    token,
    snippet: buildSnippet(buildEmbedPublicUrl(input.request), buildEmbedApiBaseUrl(input.request), state, token),
    settings: state.settings
  };
}

function defaultMessageStatus(message: string, moderateMessages: boolean) {
  if (!message) {
    return MessagePublicStatus.NONE;
  }

  return moderateMessages ? MessagePublicStatus.PENDING : MessagePublicStatus.APPROVED;
}

function normalizeDonationStatus(status?: string | null) {
  switch (String(status || "").toUpperCase()) {
    case "DONE":
      return DonationStatus.DONE;
    case "CANCELED":
    case "CANCELLED":
      return DonationStatus.CANCELED;
    case "FAILED":
      return DonationStatus.FAILED;
    default:
      return DonationStatus.CREATED;
  }
}

export async function createDonation(input: {
  projectId: string;
  amount: number;
  currency: string;
  orderName: string;
  creator: string;
  campaign: string;
  supporterName?: string;
  message?: string;
  originUrl?: string;
  pageUrl?: string;
  method?: string;
}) {
  const state = await getProjectEmbedState(input.projectId);
  if (!state) {
    throw new Error("후원 대상을 찾을 수 없습니다.");
  }

  const orderId = createOrderId();
  const message = sanitizeText(input.message, 120);

  return db.donation.create({
    data: {
      projectId: input.projectId,
      settingsId: state.settings.id,
      orderId,
      amount: input.amount,
      currency: input.currency,
      orderName: input.orderName,
      creator: input.creator,
      campaign: input.campaign,
      supporterName: sanitizeText(input.supporterName, 40) || null,
      message: message || null,
      messagePublicStatus: defaultMessageStatus(message, state.settings.moderateMessages),
      originUrl: input.originUrl || null,
      pageUrl: input.pageUrl || null,
      method: input.method || null
    }
  });
}

export async function updateDonationAfterCreate(orderId: string, checkoutUrl: string) {
  return db.donation.update({
    where: { orderId },
    data: {
      checkoutUrl
    }
  });
}

export async function findDonationByOrderId(orderId: string) {
  return db.donation.findUnique({
    where: { orderId },
    include: {
      project: {
        select: {
          id: true,
          ownerId: true,
          name: true
        }
      }
    }
  });
}

export async function updateDonationFromPayment(
  orderId: string,
  payment: Record<string, any>,
  confirmedPayload: unknown,
  sourceLabel: string
) {
  const nextStatus = normalizeDonationStatus(payment.status);

  return db.donation.update({
    where: { orderId },
    data: {
      paymentKey: typeof payment.paymentKey === "string" ? payment.paymentKey : undefined,
      status: nextStatus,
      receiptUrl: typeof payment?.receipt?.url === "string" ? payment.receipt.url : undefined,
      method: typeof payment.method === "string" ? payment.method : undefined,
      provider: typeof payment?.easyPay?.provider === "string" ? payment.easyPay.provider : undefined,
      confirmedPayload: confirmedPayload as any,
      lastWebhookEvent: sourceLabel || undefined,
      approvedAt: nextStatus === DonationStatus.DONE ? new Date() : undefined
    }
  });
}

export async function insertEmbedAnalyticsEvent(input: {
  type: string;
  projectId?: string;
  sessionId?: string;
  visitorId?: string;
  creator?: string;
  campaign?: string;
  host?: string;
  pageUrl?: string;
  pagePath?: string;
  referrer?: string;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
}) {
  const sessionId = sanitizeText(input.sessionId || input.visitorId || "embed-anonymous", 80, "embed-anonymous");

  return db.analyticsEvent.create({
    data: {
      type: input.type,
      projectId: input.projectId,
      sessionId,
      metadata: {
        source: "embed",
        visitorId: sanitizeText(input.visitorId, 80),
        creator: sanitizeText(input.creator, 48),
        campaign: sanitizeText(input.campaign, 48),
        host: sanitizeText(input.host, 255),
        pageUrl: sanitizeText(input.pageUrl, 1000),
        pagePath: sanitizeText(input.pagePath, 500),
        referrer: sanitizeText(input.referrer, 1000),
        durationMs: typeof input.durationMs === "number" && Number.isFinite(input.durationMs) ? input.durationMs : null,
        ...(input.metadata || {})
      }
    }
  });
}

export async function listPublishedMessages(limit = 30, projectId?: string | null) {
  if (projectId) {
    const state = await getProjectEmbedState(projectId);
    if (!state || !state.settings.publicMessages) {
      return [];
    }
  }

  return db.donation.findMany({
    where: {
      projectId: projectId || undefined,
      status: DonationStatus.DONE,
      message: {
        not: null
      },
      messagePublicStatus: MessagePublicStatus.APPROVED
    },
    orderBy: [
      { approvedAt: "desc" },
      { createdAt: "desc" }
    ],
    take: limit,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
}

export async function listPublishedMessagesForProjectIds(projectIds: string[], limit = 30) {
  const normalizedProjectIds = normalizeProjectIds(projectIds);
  if (normalizedProjectIds.length === 0) {
    return [];
  }

  const visibleSettings = await db.embedProjectSettings.findMany({
    where: {
      projectId: {
        in: normalizedProjectIds
      },
      publicMessages: true
    },
    select: {
      projectId: true
    }
  });

  const visibleProjectIds = visibleSettings.map((item) => item.projectId);
  if (visibleProjectIds.length === 0) {
    return [];
  }

  return db.donation.findMany({
    where: {
      projectId: {
        in: visibleProjectIds
      },
      status: DonationStatus.DONE,
      message: {
        not: null
      },
      messagePublicStatus: MessagePublicStatus.APPROVED
    },
    orderBy: [
      { approvedAt: "desc" },
      { createdAt: "desc" }
    ],
    take: limit,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
}

export async function listCreatorFeedbackMessages(limit = 30, projectId?: string | null) {
  return db.donation.findMany({
    where: {
      projectId: projectId || undefined,
      status: DonationStatus.DONE,
      message: {
        not: null
      }
    },
    orderBy: [
      { approvedAt: "desc" },
      { createdAt: "desc" }
    ],
    take: limit,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
}

export type CreatorFeedbackReadFilter = "all" | "read" | "unread";

function buildCreatorFeedbackWhere(projectIds: string[], readFilter: CreatorFeedbackReadFilter) {
  const where: Record<string, unknown> = {
    projectId: {
      in: projectIds
    },
    status: DonationStatus.DONE,
    message: {
      not: null
    }
  };

  if (readFilter === "read") {
    where.creatorReadAt = {
      not: null
    };
  }

  if (readFilter === "unread") {
    where.creatorReadAt = null;
  }

  return where;
}

export async function listCreatorFeedbackMessagesWithFilter(limit = 30, projectId?: string | null, readFilter: CreatorFeedbackReadFilter = "all") {
  const normalizedProjectIds = normalizeProjectIds(projectId ? [projectId] : []);
  if (normalizedProjectIds.length === 0) {
    return [];
  }

  return db.donation.findMany({
    where: buildCreatorFeedbackWhere(normalizedProjectIds, readFilter),
    orderBy: [
      { approvedAt: "desc" },
      { createdAt: "desc" }
    ],
    take: limit,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
}

export async function listCreatorFeedbackMessagesForProjectIds(projectIds: string[], limit = 30, readFilter: CreatorFeedbackReadFilter = "all") {
  const normalizedProjectIds = normalizeProjectIds(projectIds);
  if (normalizedProjectIds.length === 0) {
    return [];
  }

  return db.donation.findMany({
    where: buildCreatorFeedbackWhere(normalizedProjectIds, readFilter),
    orderBy: [
      { approvedAt: "desc" },
      { createdAt: "desc" }
    ],
    take: limit,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
}

export async function getCreatorFeedbackCounts(projectIds: string[]) {
  const normalizedProjectIds = normalizeProjectIds(projectIds);
  if (normalizedProjectIds.length === 0) {
    return {
      all: 0,
      read: 0,
      unread: 0
    };
  }

  const [all, read, unread] = await Promise.all([
    db.donation.count({
      where: buildCreatorFeedbackWhere(normalizedProjectIds, "all")
    }),
    db.donation.count({
      where: buildCreatorFeedbackWhere(normalizedProjectIds, "read")
    }),
    db.donation.count({
      where: buildCreatorFeedbackWhere(normalizedProjectIds, "unread")
    })
  ]);

  return {
    all,
    read,
    unread
  };
}

export async function markCreatorFeedbackMessagesAsRead(projectIds: string[]) {
  const normalizedProjectIds = normalizeProjectIds(projectIds);
  if (normalizedProjectIds.length === 0) {
    return { count: 0 };
  }

  return db.donation.updateMany({
    where: buildCreatorFeedbackWhere(normalizedProjectIds, "unread"),
    data: {
      creatorReadAt: new Date()
    }
  });
}

export async function markCreatorFeedbackMessageAsRead(projectIds: string[], messageId: string) {
  const normalizedProjectIds = normalizeProjectIds(projectIds);
  const normalizedMessageId = String(messageId || "").trim();
  if (normalizedProjectIds.length === 0 || !normalizedMessageId) {
    return { count: 0 };
  }

  return db.donation.updateMany({
    where: {
      id: normalizedMessageId,
      ...buildCreatorFeedbackWhere(normalizedProjectIds, "unread")
    },
    data: {
      creatorReadAt: new Date()
    }
  });
}

export type EmbedMetricsSummary = {
  avgDwellSeconds: number;
  donationAttempts: number;
  donationSuccessCount: number;
  errorCount: number;
  feedbackCount: number;
  repeatVisitorRate: number;
  repeatVisitors: number;
  totalAmount: number;
  uniqueVisitors: number;
  views: number;
  visits: number;
  widgetOpens: number;
};

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeProjectIds(projectIds?: string[] | null) {
  return Array.from(new Set((projectIds || []).map((item) => String(item || "").trim()).filter(Boolean)));
}

function readMetadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  return (metadata as Record<string, unknown>)[key];
}

export async function getEmbedMetricsSummary(projectIds?: string[] | null): Promise<EmbedMetricsSummary> {
  const normalizedProjectIds = normalizeProjectIds(projectIds);
  if (Array.isArray(projectIds) && normalizedProjectIds.length === 0) {
    return {
      avgDwellSeconds: 0,
      donationAttempts: 0,
      donationSuccessCount: 0,
      errorCount: 0,
      feedbackCount: 0,
      repeatVisitorRate: 0,
      repeatVisitors: 0,
      totalAmount: 0,
      uniqueVisitors: 0,
      views: 0,
      visits: 0,
      widgetOpens: 0
    };
  }

  const projectFilter =
    normalizedProjectIds.length > 0
      ? {
          in: normalizedProjectIds
        }
      : undefined;

  const [events, donations] = await Promise.all([
    db.analyticsEvent.findMany({
      where: {
        projectId: projectFilter,
        type: {
          in: ["view", "widget_open", "donation_submit", "engagement"]
        }
      },
      select: {
        type: true,
        sessionId: true,
        metadata: true
      }
    }),
    db.donation.findMany({
      where: {
        projectId: projectFilter
      },
      select: {
        amount: true,
        message: true,
        status: true
      }
    })
  ]);

  const viewEvents = events.filter((event) => event.type === "view");
  const widgetOpenEvents = events.filter((event) => event.type === "widget_open");
  const donationAttemptEvents = events.filter((event) => event.type === "donation_submit");
  const engagementEvents = events.filter((event) => event.type === "engagement");
  const visits = new Set(viewEvents.map((event) => event.sessionId).filter(Boolean)).size;

  const visitorSessions = new Map<string, Set<string>>();
  for (const event of viewEvents) {
    const visitorIdRaw = readMetadataValue(event.metadata, "visitorId");
    const visitorId = typeof visitorIdRaw === "string" ? visitorIdRaw.trim() : "";
    const sessionId = String(event.sessionId || "").trim();
    const visitorKey = visitorId || sessionId;

    if (!visitorKey) {
      continue;
    }

    const sessions = visitorSessions.get(visitorKey) || new Set<string>();
    if (sessionId) {
      sessions.add(sessionId);
    }
    visitorSessions.set(visitorKey, sessions);
  }

  const uniqueVisitors = visitorSessions.size;
  const repeatVisitors = Array.from(visitorSessions.values()).filter((sessions) => sessions.size > 1).length;
  const repeatVisitorRate = uniqueVisitors > 0 ? roundToSingleDecimal((repeatVisitors / uniqueVisitors) * 100) : 0;

  const engagementBySession = new Map<string, number>();
  for (const event of engagementEvents) {
    const durationRaw = readMetadataValue(event.metadata, "durationMs");
    const durationMs = typeof durationRaw === "number" && Number.isFinite(durationRaw) ? durationRaw : 0;
    const sessionId = String(event.sessionId || "").trim();

    if (!sessionId || durationMs <= 0) {
      continue;
    }

    engagementBySession.set(sessionId, (engagementBySession.get(sessionId) || 0) + durationMs);
  }

  const engagementValues = Array.from(engagementBySession.values());
  const avgDwellSeconds =
    engagementValues.length > 0
      ? roundToSingleDecimal(engagementValues.reduce((sum, value) => sum + value, 0) / engagementValues.length / 1000)
      : 0;

  const successDonations = donations.filter((donation) => donation.status === DonationStatus.DONE);
  const totalAmount = successDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const feedbackCount = successDonations.filter((donation) => String(donation.message || "").trim()).length;

  return {
    avgDwellSeconds,
    donationAttempts: donationAttemptEvents.length,
    donationSuccessCount: successDonations.length,
    errorCount: 0,
    feedbackCount,
    repeatVisitorRate,
    repeatVisitors,
    totalAmount,
    uniqueVisitors,
    views: viewEvents.length,
    visits,
    widgetOpens: widgetOpenEvents.length
  };
}
