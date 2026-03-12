import type { Route } from "next";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MyPageHub, { type HubKey } from "@/components/MyPageHub";
import { auth } from "@/lib/auth";
import { buildLoginHref } from "@/lib/auth-routing";
import { isAdminEmail } from "@/lib/permissions";
import { getPlatformHubBootstrap } from "@/lib/platform-hub";
import { getServiceHubBootstrap } from "@/lib/service-hub";

export const metadata: Metadata = {
  title: "마이페이지 | 밥주세요",
  description: "내 MVP 목록과 유입/전환/피드백 데이터를 확인하세요"
};

export const preferredRegion = "icn1";

type DashboardPageProps = {
  searchParams: Promise<{
    hub?: string;
  }>;
};

function resolveHub(hub: string | undefined): HubKey {
  if (hub === "platform" || hub === "service" || hub === "account" || hub === "billing") {
    return hub;
  }

  return "platform";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [resolvedSearchParams, session] = await Promise.all([searchParams, auth()]);
  const resolvedHub = resolveHub(resolvedSearchParams.hub);
  const callbackUrl = resolvedHub === "platform" ? "/dashboard" : `/dashboard?hub=${resolvedHub}`;

  if (!session?.user?.id) {
    redirect(buildLoginHref(callbackUrl) as Route);
  }

  const platformHubInitialData = resolvedHub === "platform" ? await getPlatformHubBootstrap(session) : null;
  const serviceHubInitialData = resolvedHub === "service" ? await getServiceHubBootstrap(session) : null;

  return (
    <MyPageHub
      initialHub={resolvedHub}
      showAdminLink={isAdminEmail(session.user.email)}
      platformHubInitialData={platformHubInitialData}
      serviceHubInitialData={serviceHubInitialData}
    />
  );
}
