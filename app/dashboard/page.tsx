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
  }>;
};

function resolveHub(hub: string | undefined): HubKey {
  if (hub === "platform" || hub === "service" || hub === "account" || hub === "billing") {
    return hub;
  }

  return "platform";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { hub } = await searchParams;
  const resolvedHub = resolveHub(hub);
  const callbackUrl = resolvedHub === "platform" ? "/dashboard" : `/dashboard?hub=${resolvedHub}`;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(buildLoginHref(callbackUrl) as Route);
  }

  return <MyPageHub initialHub={resolvedHub} />;
}
