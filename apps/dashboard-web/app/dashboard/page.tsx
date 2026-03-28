import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import type { BuilderDashboardTab } from "@/components/BuilderDashboard";
import MyPageHub, { type HubKey } from "@/components/MyPageHub";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "@/lib/auth-routing";
import { getUserRole } from "@/lib/permissions";
import { getPlatformHubBootstrap } from "@/lib/platform-hub";
import { getServiceHubBootstrap } from "@/lib/service-hub";

export const metadata: Metadata = {
  title: "워크스페이스 | feedback4U",
  description: "내 서비스 운영과 설정을 관리하는 워크스페이스"
};

export const preferredRegion = "icn1";

type DashboardPageProps = {
  searchParams: Promise<{
    hub?: string;
    projectId?: string;
    tab?: string;
  }>;
};

function resolveHub(hub: string | undefined): HubKey {
  if (hub === "platform" || hub === "service" || hub === "account" || hub === "billing") {
    return hub;
  }

  return "platform";
}

function resolvePlatformTab(tab: string | undefined): BuilderDashboardTab {
  if (tab === "overview" || tab === "funnel" || tab === "feedback" || tab === "waitlist" || tab === "rice") {
    return tab;
  }

  return "overview";
}

function buildDashboardCallbackUrl(hub: HubKey, projectId?: string, tab: BuilderDashboardTab = "overview") {
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
  const [resolvedSearchParams, session] = await Promise.all([searchParams, auth()]);
  const resolvedHub = resolveHub(resolvedSearchParams.hub);
  const resolvedProjectId = resolvedSearchParams.projectId?.trim() || undefined;
  const resolvedPlatformTab = resolvePlatformTab(resolvedSearchParams.tab);
  const callbackUrl = buildDashboardCallbackUrl(
    resolvedHub,
    resolvedHub === "platform" ? resolvedProjectId : undefined,
    resolvedHub === "platform" ? resolvedPlatformTab : "overview"
  );

  if (!session?.user?.id) {
    redirect(buildLoginHref(callbackUrl) as Route);
  }

  const userRole = getUserRole(session);
  const platformHubInitialData = resolvedHub === "platform" ? await getPlatformHubBootstrap(session) : null;
  const serviceHubInitialData = resolvedHub === "service" ? await getServiceHubBootstrap(session) : null;
  const isAdmin = Boolean(session.user.isAdmin || session.user.role === "admin" || userRole === "admin");

  return (
    <MyPageHub
      initialHub={resolvedHub}
      userRole={isAdmin ? "admin" : "creator"}
      showAdminLink={isAdmin}
      initialProjectId={resolvedHub === "platform" ? resolvedProjectId : undefined}
      initialPlatformTab={resolvedHub === "platform" ? resolvedPlatformTab : "overview"}
      platformHubInitialData={platformHubInitialData}
      serviceHubInitialData={serviceHubInitialData}
    />
  );
}
