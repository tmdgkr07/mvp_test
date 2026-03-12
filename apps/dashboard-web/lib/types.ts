import { DefaultSession } from "next-auth";
import type { ProjectStatus } from "@/lib/project-status";

export type EventType =
  | "project_impression"
  | "website_click"
  | "support_button_click"
  | "feedback_submit"
  | "session_end";

export type FunnelStage = "main_exposure" | "website_click" | "support_click" | "feedback_submit";

export type Sentiment = "positive" | "negative" | "neutral";

export interface Project {
  id: string;
  ownerId: string | null;
  deletedById: string | null;
  deletedAt: string | null;
  slug: string;
  name: string;
  tagline: string;
  detailContent: string;
  websiteUrl: string;
  supportUrl: string;
  thumbnailUrl: string;
  status: ProjectStatus;
  voteCount: number;
  commentCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  projectId?: string;
  sessionId: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface Feedback {
  id: string;
  projectId: string;
  sessionId: string;
  comment: string;
  sentiment: Sentiment;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  tagline?: string;
  detailContent?: string;
  websiteUrl: string;
  supportUrl: string;
  thumbnailUrl?: string;
  status?: ProjectStatus;
  tags?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  tagline?: string;
  detailContent?: string;
  websiteUrl?: string;
  supportUrl?: string;
  thumbnailUrl?: string;
  status?: ProjectStatus;
  tags?: string[];
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
