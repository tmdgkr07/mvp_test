import type { Metadata } from "next";
import MyPageHub, { type HubKey } from "@/components/MyPageHub";

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

  return <MyPageHub initialHub={resolveHub(hub)} />;
}
