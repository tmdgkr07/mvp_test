import type { Route } from "next";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MyPageHub, { type HubKey } from "@/components/MyPageHub";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "@/lib/auth-routing";

export const metadata: Metadata = {
  title: "마이페이지 | 밥주세요",
  description: "내 MVP 목록과 유입/전환/피드백 데이터를 확인하세요."
};

type DashboardPageProps = {
  searchParams: Promise<{
    hub?: string;
    projectId?: string;
    tab?: string;
  }>;
};

type PlatformTab = "overview" | "funnel" | "feedback" | "waitlist" | "rice";

function resolveHub(hub: string | undefined): HubKey {
  if (hub === "platform" || hub === "service" || hub === "account" || hub === "billing") {
    return hub;
  }

  return "platform";
}

function resolvePlatformTab(tab: string | undefined): PlatformTab {
  if (tab === "overview" || tab === "funnel" || tab === "feedback" || tab === "waitlist" || tab === "rice") {
    return tab;
  }

  return "overview";
}

function buildDashboardCallbackUrl(hub: HubKey, projectId?: string, tab: PlatformTab = "overview") {
  const params = new URLSearchParams();

  if (hub !== "platform") {
    params.set("hub", hub);
  }

  if (hub === "platform") {
    if (projectId) {
      params.set("projectId", projectId);
    }

    if (tab !== "overview") {
      params.set("tab", tab);
    }
  }

  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { hub, projectId, tab } = await searchParams;
  const resolvedHub = resolveHub(hub);
  const resolvedProjectId = projectId?.trim() || undefined;
  const resolvedPlatformTab = resolvePlatformTab(tab);
  const callbackUrl = buildDashboardCallbackUrl(
    resolvedHub,
    resolvedHub === "platform" ? resolvedProjectId : undefined,
    resolvedHub === "platform" ? resolvedPlatformTab : "overview"
  );
  const session = await auth();

  if (!session?.user?.id) {
    redirect(buildLoginHref(callbackUrl) as Route);
  }

  return (
    <MyPageHub
      initialHub={resolvedHub}
      initialProjectId={resolvedHub === "platform" ? resolvedProjectId : undefined}
      initialPlatformTab={resolvedHub === "platform" ? resolvedPlatformTab : "overview"}
    />
  );
}
