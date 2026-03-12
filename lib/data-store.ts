import { prisma } from "@/lib/prisma";
import type { AnalyticsEvent, CreateProjectInput, Feedback, Project, Sentiment, UpdateProjectInput } from "@/lib/types";
import { createSlug, parseMetadata, toISOStringSafe } from "@/lib/utils";

function mapProject(project: {
  id: string;
  ownerId: string | null;
  deletedById: string | null;
  deletedAt: Date | null;
  slug: string;
  name: string;
  tagline: string;
  detailContent: string;
  websiteUrl: string;
  supportUrl: string;
  thumbnailUrl: string;
  status: "IDEA" | "VALIDATING" | "DEVELOPING" | "RELEASED" | "GROWING" | "PAUSED" | "PIVOTED";
  voteCount: number;
  commentCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return {
    ...project,
    deletedAt: project.deletedAt ? toISOStringSafe(project.deletedAt) : null,
    tags: project.tags || [],
    createdAt: toISOStringSafe(project.createdAt),
    updatedAt: toISOStringSafe(project.updatedAt)
  };
}

function mapEvent(event: {
  id: string;
  type: string;
  projectId: string | null;
  sessionId: string;
  timestamp: Date;
  metadata: unknown;
}): AnalyticsEvent {
  return {
    id: event.id,
    type: event.type as AnalyticsEvent["type"],
    projectId: event.projectId ?? undefined,
    sessionId: event.sessionId,
    timestamp: toISOStringSafe(event.timestamp),
    metadata: (event.metadata as AnalyticsEvent["metadata"]) || undefined
  };
}

function mapFeedback(feedback: {
  id: string;
  projectId: string;
  sessionId: string;
  comment: string;
  sentiment: string;
  createdAt: Date;
}): Feedback {
  return {
    ...feedback,
    sentiment: feedback.sentiment as Sentiment,
    createdAt: toISOStringSafe(feedback.createdAt)
  };
}

async function uniqueSlug(name: string, exceptId?: string): Promise<string> {
  const base = createSlug(name);
  let slug = base;
  let index = 2;

  while (true) {
    const found = await prisma.project.findUnique({ where: { slug } });
    if (!found || found.id === exceptId) {
      return slug;
    }
    slug = `${base}-${index}`;
    index += 1;
  }
}

export async function listProjects(options?: { includeDeleted?: boolean }): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: options?.includeDeleted ? undefined : { deletedAt: null },
    orderBy: { createdAt: "desc" }
  });
  return (rows as any[]).map(mapProject);
}

export async function getProjectById(id: string, options?: { includeDeleted?: boolean }): Promise<Project | undefined> {
  const row = await prisma.project.findFirst({
    where: {
      id,
      ...(options?.includeDeleted ? {} : { deletedAt: null })
    }
  });
  return row ? mapProject(row as any) : undefined;
}

export async function createProject(input: CreateProjectInput, ownerId: string): Promise<Project> {
  const slug = await uniqueSlug(input.name);
  const row = await prisma.project.create({
    data: {
      ownerId,
      slug,
      name: input.name,
      tagline: input.tagline?.trim() || "아직 소개 문구가 등록되지 않았습니다.",
      detailContent: input.detailContent?.trim() || "",
      websiteUrl: input.websiteUrl,
      supportUrl: input.supportUrl,
      thumbnailUrl: input.thumbnailUrl?.trim() || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(input.name)}`,
      status: input.status || "IDEA",
      tags: input.tags || []
    }
  });

  return mapProject(row as any);
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | undefined> {
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    return undefined;
  }

  let slug = existing.slug;
  if (input.name && input.name.trim() && input.name.trim() !== existing.name) {
    slug = await uniqueSlug(input.name.trim(), existing.id);
  }

  const row = await prisma.project.update({
    where: { id },
    data: {
      slug,
      name: input.name?.trim() || undefined,
      tagline: input.tagline?.trim() || undefined,
      detailContent: input.detailContent?.trim() || undefined,
      websiteUrl: input.websiteUrl?.trim() || undefined,
      supportUrl: input.supportUrl?.trim() || undefined,
      thumbnailUrl: input.thumbnailUrl?.trim() || undefined,
      status: input.status || undefined,
      tags: input.tags || undefined
    }
  });

  return mapProject(row as any);
}

export async function voteProject(id: string): Promise<Project | undefined> {
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return undefined;

  const row = await prisma.project.update({
    where: { id },
    data: { voteCount: { increment: 1 } }
  });

  return mapProject(row as any);
}

export async function softDeleteProject(id: string, actorId: string): Promise<Project | undefined> {
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    return undefined;
  }

  const row = await prisma.project.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedById: actorId
    }
  });

  return mapProject(row as any);
}

export async function restoreProject(id: string): Promise<Project | undefined> {
  const existing = await prisma.project.findFirst({
    where: {
      id,
      NOT: { deletedAt: null }
    }
  });
  if (!existing) {
    return undefined;
  }

  const row = await prisma.project.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedById: null
    }
  });

  return mapProject(row as any);
}

export async function appendEvent(input: {
  type: AnalyticsEvent["type"];
  sessionId: string;
  projectId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<AnalyticsEvent> {
  const row = await prisma.analyticsEvent.create({
    data: {
      type: input.type,
      sessionId: input.sessionId,
      projectId: input.projectId,
      metadata: input.metadata
    }
  });

  return mapEvent(row);
}

export async function listEvents(projectId?: string): Promise<AnalyticsEvent[]> {
  const rows = await prisma.analyticsEvent.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { timestamp: "desc" }
  });
  return rows.map(mapEvent);
}

export async function createFeedback(input: {
  projectId: string;
  sessionId: string;
  comment: string;
  sentiment: Sentiment;
}): Promise<Feedback> {
  const row = await prisma.feedback.create({
    data: {
      projectId: input.projectId,
      sessionId: input.sessionId,
      comment: input.comment,
      sentiment: input.sentiment
    }
  });

  await prisma.project.update({
    where: { id: input.projectId },
    data: { commentCount: { increment: 1 } }
  });

  return mapFeedback(row);
}

export async function listFeedback(projectId?: string): Promise<Feedback[]> {
  const rows = await prisma.feedback.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" }
  });

  return rows.map(mapFeedback);
}

export async function getProjectOwnerId(projectId: string): Promise<string | null | undefined> {
  const row = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { ownerId: true }
  });
  return row?.ownerId;
}

export async function getProjectMetaById(projectId: string): Promise<{ ownerId: string | null; deletedAt: string | null } | undefined> {
  const row = await prisma.project.findFirst({
    where: { id: projectId },
    select: { ownerId: true, deletedAt: true }
  });

  if (!row) {
    return undefined;
  }

  return {
    ownerId: row.ownerId,
    deletedAt: row.deletedAt ? toISOStringSafe(row.deletedAt) : null
  };
}

export async function getGlobalStats() {
  const [projectCount, userCount, voteAggregate] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.user.count(),
    prisma.project.aggregate({
      where: { deletedAt: null },
      _sum: { voteCount: true }
    })
  ]);

  return {
    totalProjects: projectCount,
    totalUsers: userCount,
    totalVotes: voteAggregate._sum.voteCount || 0
  };
}

export function normalizeEventMetadata(input: unknown) {
  return parseMetadata(input);
}
